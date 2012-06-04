// Look up the location of the individual given a position object defined by W3C geolocation api
function lookup(position) {
  // Using the geonames postal code lookup
  $.getJSON("http://api.geonames.org/findNearbyPostalCodesJSON",
            {"lat":position.coords.latitude,
             "lng":position.coords.longitude,
             "maxRows":"1",
             "username":"mobilesemtech2011"},
            function(data,status,xhr) {

	      var x=null;

	      // Verify that we've got results
	      if(typeof(data.postalCodes.length)!==undefined &&
                 data.postalCodes.length > 0)
                x = data.postalCodes[0];
	      if(!x) return;

	      // Update the local store
	      window.store.getAt(0).set('text',"Location: "+x.placeName+
					", "+x.adminName1);

	      // From postal code, attempt to get to DBpedia URI
	      getGeonamesId(x.placeName,x.adminCode1,x.countryCode);
            });
}

// Gets the Geonames ID so we can find the DBpedia URI
function getGeonamesId(name,admin,country) {
  // Generic search interface for Geonames
  $.getJSON("http://api.geonames.org/searchJSON",
            {"name":name,
             "maxRows":"1",
             "country":country,
             "featureCode":"PPLA2",
             "adminCode1":admin,
             "username":"mobilesemtech2011"},
            function(data,status,xhr) {

	      var x = null;

	      // Verify that we have a result
	      if(typeof(data.geonames.length)!==undefined &&
                 data.geonames.length > 0)
                x = data.geonames[0];
	      if(!x) return;

	      // Get the URI and perform SPARQL query against DBpedia
	      var uri = "http://sws.geonames.org/"+x.geonameId+"/";
	      //$("#uri").text(uri);
	      if(uri!=null && uri != "") {
                lookupURI(uri);
	      }
            });
}

// Look up a URI in DBpedia from another LOD URI
function lookupURI(uri) {
  // Query the DBpedia endpoint
  $.get("http://dbpedia.org/sparql",
	{"query":"\
PREFIX owl: <http://www.w3.org/2002/07/owl#> \
SELECT ?uri ?alt WHERE { \
{ ?uri owl:sameAs <"+uri+"> } UNION { <"+uri+"> owl:sameAs ?uri } \
OPTIONAL { ?uri <http://dbpedia.org/ontology/wikiPageRedirects> ?alt } \
}",
	 "format":"application/sparql-results+json"},
	function(data,status,xhr) {
	  var vals = data.results.bindings;
	  var str="";

	  // Loop through the results and extract URIs
	  for(var i=0;i<vals.length;i++) {
	    if(i>0) str += "<br/>";
	    var val = vals[i].uri.value;
	    if(/%/.test(val))
	      val = unescape(val);
	    str += val;
	    if(vals[i].alt && vals[i].alt.value != "") {
	      str += "<br/>";
	      val = vals[i].alt.value;
	      if(/%/.test(val))
		val = unescape(val);
	      str += val;
	    }
	  }
	  // put URI in localstorage
	  window.localStorage["dbpedia.uri"] = str;

	  // Lookup artists affiliated with this URI
	  findArtists(str);
	},
	"json");
}
