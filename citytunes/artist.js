/* -*- espresso-indent-level: 2; -*- */

// Ensure namespace for city
Ext.ns('city')

// Register model for artists
Ext.regModel("artist", {
  fields: ['id', 'uri', 'name', 'itunes'],
  proxy: {
    type: 'localstorage',
    id: 'artist-data'
  }
});

// Global store for artists
city.ArtistStore = new Ext.data.Store({
  model: 'artist',
  sorters: 'name',
  getGroupString: function(record) {
    return record.get('name');
  },
  autoLoad: true
});

// Main list for displaying artists
city.Artists = new Ext.List({
  title: 'Artists from {city}',
  deferEmptyText: true,
  emptyText: '<div class="demos-loading">Loading&hellip;</div>',
  store: city.ArtistStore,
  grouped: true,
  itemTpl: '<tpl for="."><div class="artist"><strong>{name}</strong></div></tpl>',
  itemSelector: 'div.artist',
  singleSelect: true,
  
  // Tap handler for the artists
  onItemTap: function(dv, index, item, e) {

    // Get the parent
    var aux = this.ownerCt;
    var r = city.ArtistStore.getAt(index),
    card = city.ArtistDiscography,
    stackElement = new Array();

    // Configure stack element
    stackElement['card'] = this;
    stackElement['uri'] = null;
    stackElement['title'] = this.title;

    // Push new element onto stack
    aux.NavStack.push(stackElement);
    aux.toggleUiBackButton();
    aux.setCard(card, 'slide');
    aux.currentCard = card;

    // Update the artist card
    card.updateGeneric(r.get('uri'));
  }
});

// Generate a callback
function callback(func,obj,val,artist) {
  return function() { window.console.log(artist); return func.call(obj,val,artist); }
}

// Find artists based on a certain URI
function findArtists(uri) {
  if(city.ArtistStore.getCount()==0) {
  $.get("http://dbpedia.org/sparql",
	{"query":"\
PREFIX dbpedia-owl: <http://dbpedia.org/ontology/> \
PREFIX foaf: <http://xmlns.com/foaf/0.1/> \
SELECT ?artist ?name WHERE { \
?artist dbpedia-owl:hometown <"+uri+"> . \
{ ?artist a dbpedia-owl:Band } UNION { ?artist a dbpedia-owl:MusicalArtist } \
?artist foaf:name ?name \
} ORDER BY ASC(?name)",
	 "format":"application/sparql-results+json"},
	function(data,status,xhr) {
	  var tbl = $("ul#artists");
	  for(i=0;i<data.results.bindings.length;i++) {
	    // Extract information from SPARQL results
	    var name=data.results.bindings[i].name.value;
	    var iname=escape(name.toLowerCase().replace(/ /g,"-"));
	    var artist=data.results.bindings[i].artist.value
	    // Add data to the local store
	    city.ArtistStore.add({'uri':artist,
				  'name':name,
				  'itunes':'http://itunes.com/'+iname});
	  }
	  // Sync (i.e. commit) the store
	  city.ArtistStore.sync();
	},
	"json");
  }
}
