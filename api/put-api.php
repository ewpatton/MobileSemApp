<?php

define('CHUNK',4096);

require_once('settings.php');
require_once('con-neg.php');
require_once('sparql1.1.php');

function base_url() {
  return (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"]!="off" ?
	  "https://" : "http://").$_SERVER["SERVER_NAME"];
}

if($_SERVER['REQUEST_METHOD'] != "PUT") {
  header("HTTP/1.1 405 Method Not Allowed");
  header("Allow: PUT");
  exit;
}

header("Access-Control-Origin-Allow: *");
header("Content-Type: text/plain");

try {
  if(!($data = fopen("php://input", "r")))
    throw new Exception("Cannot read PUT data, is Content-Length set?");
  $wrote = 0;
  $tmp = "/tmp/PUT_FILE_".mt_rand();
  if(!($fp = fopen($tmp, "w")))
    throw new Exception("Cannot create temporary file. Check server permissions.");
  while($bytes = fread($data, CHUNK)) {
    $bytesIn = strlen($bytes);
    if(($bytesOut = fwrite($fp, $bytes)) != $bytesIn)
      throw new Exception("Cannot write to temporary file. Check server permissions.");
    $wrote += $bytesOut;
  }
  fclose($fp);
  fclose($data);
  // could check bytes here...
  
  // check content type
  $types = array("image/jpeg",
		 "application/rdf+xml",
		 "text/n3",
		 "text/turtle");
  $type = getBestSupportedMimeType($types, $_SERVER["HTTP_CONTENT_TYPE"]);
  if($type["type"] == "image/jpeg") {
    // warning: not checking whether this is a valid path or not!
    if(isset($type["base64"])) {
      $res = NULL;
      $out = array();
      exec("openssl enc -base64 -d -A -in $tmp -out ".$_SERVER["PATH_TRANSLATED"], $out, $res);
      if($res==0) {
	header("HTTP/1.1 201 Created");
	header("Location: ".base_url().$_SERVER["PATH_INFO"]);
      }
      else {
	header("HTTP/1.1 500 Internal Server Error");
	echo '{"error":"File not properly coded."}';
      }
    }
    else if(rename($tmp,$_SERVER["PATH_TRANSLATED"])) {
      header("HTTP/1.1 201 Created");
      header("Location: ".base_url().$_SERVER["PATH_INFO"]);
    }
    else {
      header("HTTP/1.1 500 Internal Server Error");
      echo '{"error":"Server could not store file."}';
    }
  }
  else {
    if($type["type"] == "application/rdf+xml" ||
       $type["type"] == "text/n3" ||
       $type["type"] == "text/turtle") {
      if(isset($_GET["metadata"])) {
	if(!is_file($_SERVER["PATH_TRANSLATED"])) {
	  header("HTTP/1.1 409 Conflict");
	  header("Content-Type: text/html");
	  echo '{"error":"No file '.$_SERVER["PATH_INFO"].' exists. PUT that resource before PUTting metadata."}';
	}
	else {
	  // handle posting information to fuseki here
	  $sparql = new SPARQLServer("http://".$fuseki["addr"].":".$fuseki["port"]."/".$fuseki["dataset"]);
	  if(!$sparql->put($tmp, base_url().$_SERVER["PATH_INFO"]."?metadata", $type)) {
	    header("HTTP/1.1 500 Internal Server Error");
	    header("Content-Type: text/html");
	    echo '{"error":"We were unable to process your request at this time."}';
	  }
	  else {
	    header("HTTP/1.1 201 Created");
	    header("Location: ".base_url().$_SERVER["PATH_INFO"]."?metadata");
	  }
	}
      }
      else {
	header("HTTP/1.1 405 Method Not Allowed");
	header("Allow: PUT");
      }
    }
  }
  if(is_file($tmp)) {
    unlink($tmp);
  }
}
catch(Exception $e) {
  header("HTTP/1.1 500 Server Error");
  echo $e->getMessage()."\n";
}
