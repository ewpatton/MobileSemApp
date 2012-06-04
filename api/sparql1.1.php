<?php

class SPARQLServer {

  protected $base = NULL;

  public function __construct($base) {
    $this->base = $base;
  }

  public function put($file, $graph, $mime) {
    $url = $this->base . "/data?graph=";
    $url .= urlencode($graph);
    $data = file_get_contents($file);
    if($data != NULL) {
      $opts = array('http'=>
		    array('method'=>"PUT",
			  'header'=>
			  array("Content-Type: $mime",
				"Content-Length: ".strlen($data))));
      $ctx = stream_context_create($opts);
      try {
	$result = file_get_contents($url, false, $ctx);
	if($result==false)
	  return false;
	return true;
      }
      catch(Exception $e) {
	return false;
      }
    }
  }
}
