<?php

function sort_mime($a, $b) {
  if($a["q"] == $b["q"]) return 0;
  return ($a["q"] > $b["q"]) ? -1 : 1;
}

// Gets the best possible mime type from the HTTP Accept header
function getBestSupportedMimeType($mimeTypes = null, $text = null) {
  // Values will be stored in this array
  $AcceptTypes = Array ();

  if($text == NULL) {
    if(isset($_SERVER['HTTP_ACCEPT']))
      $text = $_SERVER['HTTP_ACCEPT'];
    else
      $text = "";
  }

  // Accept header is case insensitive, and whitespace isn’t important
  $accept = strtolower(str_replace(' ', '', $text));
  // divide it into parts in the place of a ","
  $accept = explode(',', $accept);
  foreach ($accept as $a) {
    $params = explode(';', $a);
    $obj = array("type" => $params[0], "q" => 1);
    $mime = $params[0];
    for($i=1;$i<count($params);$i++) {
      $parts = explode('=', $params[$i]);
      if($parts[0] == "q") {
	$obj["q"] = intval($parts[1]);
      }
      else if(count($parts) == 1) {
	$obj[$parts[0]] = true;
      }
      else {
	$obj[$parts[0]] = $obj[$parts[1]];
      }
    }

    if($obj["q"] > 0)
      $AcceptTypes[$mime] = $obj;
  }
  uasort($AcceptTypes, 'sort_mime');

  // if no parameter was passed, just return parsed data
  if (!$mimeTypes) return $AcceptTypes;

  $mimeTypes = array_map('strtolower', (array)$mimeTypes);

  // let’s check our supported types:
  foreach ($AcceptTypes as $mime => $q) {
    if ($q && in_array($mime, $mimeTypes)) return $q;
  }
  // no mime-type found
  return null;
}
