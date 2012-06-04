/* -*- espresso-indent-level: 2; -*- */

// Add a city namespace
Ext.ns('city');

// Register a model for the main menu
Ext.regModel("MainMenu", { fields: ["text"] });

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

// This is the navigation view that is the parent of all other views
city.NavPanel = null;

// Setup function for Sencha Touch
Ext.setup({
    tabletStartupScreen: 'tablet_startup.png',
    phoneStartupScreen: 'phone_startup.png',
    icon: 'icon.png',
    glossOnIcon: false,
    onReady: function() {

      // Initialize the data store for the main menu
      window.store = new Ext.data.JsonStore({
	model: "MainMenu",
	data: [
	  {text: 'Location: <img src="loading.gif"/>'},
	  {text: "Find Artists"}
	]
      });

      // Initiate GPS lookup
      navigator.geolocation.getCurrentPosition(lookup);

      // Prepare list view for main menu
      var list = new Ext.List({
	fullscreen: true,
	cls: "location",
	itemSelector: "div.x-list-item",
	itemTpl: '{text}',
	store: window.store,
      });

      // Handler for when an item in the main menu is tapped
      var handler = function(view, idx, item, evt) {

	list.deselect(window.store.getAt(idx),true);

	// We're only interested in behavior of the second item
	if(idx==1) {

	  // Push state onto the stack
	  var stackItem = {
	    'title': 'CityTunes',
	    'card': this
	  };
	  city.NavPanel.stack.push(stackItem);

	  // Create a list view for the artists
	  var artistList = new Ext.List({
	    fullscreen: true,
	    cls: 'artists',
	    itemSelector: 'div.x-list-item',
	    itemTpl: '{name}',
	    store: city.ArtistStore
	  });

	  // Create a panel to hold the artist list
	  var newPanel = new Ext.Panel({
	    fullscreen: true,
	    items: [ artistList ]
	  });

	  // Handler for when an artist is tapped
	  var handler2 = function(view, idx, item, evt) {

	    var artist = city.ArtistStore.getAt(idx);
	    // Create the discography store
	    var albumStore = discographyStoreForArtist(artist);

	    // Create an album list view
	    var albumList = new Ext.List({
	      fullscreen: true,
	      cls: "albums",
	      itemSelector: "div.x-list-item",
	      itemTpl: '{title} ({year}, {tracks} tracks)',
	      store: albumStore
	    });

	    // Panel to hold the list
	    var newPanel2 = new Ext.Panel({
	      fullscreen: true,
	      items: [ albumList ]
	    });

	    // iTunes launch listener
	    albumList.addListener("itemtap",function(view, idx, item, evt) {
	      window.location.href = albumStore.getAt(idx).get('itunes');
	    }, newPanel2);

	    // New stack item for navigation
	    var stackItem2 = {
	      title: 'Artists',
	      card: newPanel
	    };

	    // Update the UI
	    city.NavPanel.stack.push(stackItem2);
	    city.NavPanel.setActiveItem(newPanel2,'slide');
	    city.NavPanel.dockedItems.getAt(0).setTitle("Albums");
	    city.NavPanel.updateButton();
	  };

	  // Tap listener for the artist
	  artistList.addListener("itemtap",handler2,newPanel);

	  // Update the main display to show the new window
	  city.NavPanel.setActiveItem(newPanel,'slide');
	  city.NavPanel.dockedItems.getAt(0).setTitle("Artists");
	  city.NavPanel.updateButton();
	}
      };
      
      // Panel to host the main menu
      var subpanel = new Ext.Panel({
	fullscreen: true,
	items: [ list ]
      });

      // Back button for navigation
      var btn = new Ext.Button({
	text: 'Back',
	ui: 'back',
	hidden: true,
	scope: this
      });

      // Navigation panel
      city.NavPanel = new Ext.Panel({
	fullscreen: true,
	layout: 'card',
	dockedItems: [
	  // Toolbar configuration
	  {
	    dock: "top",
	    xtype: "toolbar",
	    title: "CityTunes",
	    items: [btn]
	  }
	],
	items: [subpanel]
      });

      // Add tap listener
      list.addListener("itemtap",handler,subpanel);

      // Configure state
      city.NavPanel.stack = new Array();
      city.NavPanel.backButton = btn;
      city.NavPanel.popView = function() {
	var top = city.NavPanel.stack.pop();
	city.NavPanel.setActiveItem(top.card,{type:'slide', reverse:true});
	city.NavPanel.dockedItems.getAt(0).setTitle(top.title);
	city.NavPanel.updateButton();
      };
      btn.setHandler(city.NavPanel.popView);
      city.NavPanel.updateButton = function() {
	if(city.NavPanel.stack.length==0) {
	  city.NavPanel.backButton.hide('fade');
	}
	else {
	  city.NavPanel.backButton.show('fade');
	}
      };

      // Display the interface
      city.NavPanel.show();
    }});
