/* -*- espresso-indent-level: 2; -*- */

// Ensure the city namespace exists
Ext.ns('city');

// Model for the discography information
Ext.regModel("discography", {
  fields: ['id', 'uri', 'title', {name:'tracks', type:'int'}, {name: 'year', type: 'int'}, 'itunes'],
});

// Retrieve discography information from the LOD cloud
function getDiscography(artist, albumStore) {
  var li = this;
  // We are passing through our SPARQL proxy service due to CORS limitations
  $.get("http://logd.tw.rpi.edu/sparqlproxy.php",
	{"service-uri":"http://dbtune.org/musicbrainz/sparql",
	 "query-option":"text",
	 "output":"sparqljson",
	 "query":"\
PREFIX owl: <http://www.w3.org/2002/07/owl#> \
PREFIX mo: <http://purl.org/ontology/mo/> \
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> \
PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
PREFIX vocab: <http://dbtune.org/musicbrainz/resource/vocab/> \
PREFIX dc: <http://purl.org/dc/elements/1.1/> \
SELECT ?record ?title ?tracks ?date WHERE { \
?artist owl:sameAs <"+artist.get('uri')+"> . \
?record foaf:maker ?artist . \
?record a mo:Record . \
?record rdfs:label ?title . \
?record vocab:tracks ?tracks . \
?record dc:date ?date \
} ORDER BY ASC(?date)"},
	function(data,status,xhr) {
	  var rows = data.results.bindings;
	  for(i=0;i<rows.length;i++) {
	    // Extract disc information from SPARQL results
	    var uri = rows[i].record.value;
	    var tracks = rows[i].tracks.value;
	    var title = rows[i].title.value;
	    var ititle = escape(title.toLowerCase().replace(/ /g,"-"));
	    var year = rows[i].date.value.substring(0,4);

	    // Add data to store
	    albumStore.add({'uri': uri,
		       'title': title,
		       'tracks': tracks,
		       'year': year,
		       'itunes': artist.get('itunes')+"/"+ititle});
	  }
	  // Sync (i.e. commit) the store
	  albumStore.sync();
	},
	"json");
}

// Generate a store object for the discography data
function discographyStoreForArtist(artist) {

  var albumStore = new Ext.data.Store({
    model: 'discography',
    sorters: 'date',
    autoLoad: true,
    proxy: {
      type: 'localstorage',
      id: artist.get('uri')
    }
  });
  
  // Load the store if it exists in window.localStorage
  albumStore.load();

  // Continue loading data if no data exists
  if(albumStore.getCount()==0) {
    getDiscography(artist, albumStore);
  }

  return albumStore;
}