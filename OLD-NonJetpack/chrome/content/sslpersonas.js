/**
 * 
 * SSLPERSONAS
 * credits: 
 * Chris Beard <cbeard@mozilla.org> for Personas Plus Addon. It was a huge help. 
 * Everaldo Coelho <everaldo@everaldo.com> for Alert Sign - License: LGPL - CC
 * Andras Tim <andras.tim@gmail.com> for New MitM Me Addon (Bypass Concept). 
 * ArtistsValley.com for golden Certificate badge - Custom License (http://www.veryicon.com/icon/System/Artists%20Valley%20Sample/README.txt)
 * vistaico.com for locker icon - License: CC
 */

/**
 * SSLP namespace.
 * Now wrapped, thanks to J.Bolanos for the advice.
 */
if ("undefined" == typeof(SSLP)) {
  var SSLP = {
    init : function() {
	  /* set up shortcuts to XPCom*/
	  if (typeof Cc == "undefined")
	    Cc = Components.classes;
	  if (typeof Ci == "undefined")
	    Ci = Components.interfaces;
	  if (typeof Cr == "undefined")
	    Cr = Components.results;
	  if (typeof Cu == "undefined")
	    Cu = Components.utils;
	  
	  
	  pl_interface = Ci.nsIWebProgressListener;
	  observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
	  gSSLStatus = null;
	  gCert = null;
	  gBroken = null;
	  gIsThemeSelected = null;
	  
	  try { Cu.import("resource://sslpersonas/chrome/content/lwtm.js"); }
	  catch (e) {alert(e)};
  	}
  };

  (function() {
    this.init();
  }).apply(SSLP);
};



/**
 * this listener handles SSL state as well as location 
 * changes.
 */
SSLP.sslp_listener = {
  QueryInterface: function(aIID)
  {
   if (aIID.equals(Ci.nsIWebProgressListener) ||
       aIID.equals(Ci.nsISupportsWeakReference) ||
       aIID.equals(Ci.nsISupports))
     return this;
   throw Components.results.NS_NOINTERFACE;
  },

  onStateChange: function(aBrowser, aWebProgress, aRequest, aFlag, aStatus)
  {
	  var htmlDoc = aBrowser.contentDocument;
	  var tabindex = gBrowser.getBrowserIndexForDocument(htmlDoc);
	  
	  // the tab that triggered the event, is now passed to the handler
	  // that switches the persona, if needed.
	  // aState is the NEW State of the Certificate;
	  var docuri = htmlDoc.documentURI;
	  
	  //SSLP.SSLPersonas.sslStateHandler(tabindex,aStatus);
  },

  onLocationChange: function(aBrowser, aProgress, aRequest, aURI){
	var htmlDoc = aBrowser.contentDocument;
	var tabindex = gBrowser.getBrowserIndexForDocument(htmlDoc);
	var docuri = htmlDoc.documentURI;
	var tab = gBrowser.getBrowserAtIndex(tabindex);
	var aState = tab.securityUI.state;
	if (/^about:sslpersonas/.test(docuri)) { 
		SSLP.SSLPersonas.sslStateHandler(tabindex,aState);
	}
  },

  
  onProgressChange: function(aWebProgress, aRequest, curSelf, maxSelf, curTot, maxTot) { },
  onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { },
  onSecurityChange: function(aBrowser, aWebProgress, aRequest, aState) {
	  var htmlDoc = aBrowser.contentDocument;
	  var tabindex = gBrowser.getBrowserIndexForDocument(htmlDoc);
	  var docuri = htmlDoc.documentURI;
	  
	  
	  // the tab that triggered the event, is now passed to the handler
	  // that switches the persona, if needed.
	  // aState is the NEW State of the Certificate;
	  SSLP.SSLPersonas.sslStateHandler(tabindex,aState);
  }
}



/*
 * we want to change the persona for each tab, if there 
 * are different ssl states
 */
SSLP.tabChangeListener = {
  handleEvent: function(){
	var index = gBrowser.tabContainer.selectedIndex;
	//var state = gBrowser.securityUI.nsISecureBrowserUI.state;
	var tab = gBrowser.getBrowserAtIndex(index);
	var tabState = tab.securityUI.state;
	
	var htmlDoc = tab.contentDocument;
	var docuri = htmlDoc.documentURI;
	
	SSLP.SSLPersonas.sslStateHandler(index,tabState);
  }
};



/*
 * this is an event listener
 * that handles events that are triggered by
 * the certificate error warning pages.
 * we only react if there is a corresponding preference branch.
 * if there isn't - we delegate the event to the original BrowserOnCommand
 */
SSLP.onCommand = function(event){
    // Don't trust synthetic events
    if (!event.isTrusted)
      return;
    
    
    var doOverride = gPrefService.getBoolPref("extensions.sslpersonas.override_certerror");
    
    
    var ot = event.originalTarget;
    var errorDoc = ot.ownerDocument;
    var uri = gBrowser.currentURI;
      if(ot == errorDoc.getElementById('SSLPexceptionDialogButton') && doOverride){
    	
        // Get the cert
        var recentCertsSvc = Components.classes["@mozilla.org/security/recentbadcerts;1"]
                            .getService(Components.interfaces.nsIRecentBadCertsService);

        var hostWithPort = uri.host + ":" + uri.port;
        SSLP.gSSLStatus = gBrowser.securityUI
                                .QueryInterface(Components.interfaces.nsISSLStatusProvider)
                                .SSLStatus;
        if(!SSLP.gSSLStatus) {
          try {
            var recentCertsSvc = Components.classes["@mozilla.org/security/recentbadcerts;1"]
                                 .getService(Components.interfaces.nsIRecentBadCertsService);
            if (!recentCertsSvc)
              return;

            var hostWithPort = uri.host + ":" + uri.port;
            SSLP.gSSLStatus = recentCertsSvc.getRecentBadCert(hostWithPort);
          }
          catch (e) {
            Components.utils.reportError(e);
            return;
          }
        }

        if(!SSLP.gSSLStatus)
          SSLP.SSLPersonas.getCert(uri,"browserOnCommand");

        if(!SSLP.gSSLStatus) {
          Components.utils.reportError("SSLPersonas - No gSSLStatus on attempt to add exception")
          return;
        }

        SSLP.gCert = SSLP.gSSLStatus.QueryInterface(Components.interfaces.nsISSLStatus).serverCert;
        if(!SSLP.gCert){
          Components.utils.reportError("SSLPersonas - No gCert on attempt to add exception")
          return;
        }
        // Add the exception
        var overrideService = Components.classes["@mozilla.org/security/certoverride;1"]
                                        .getService(Components.interfaces.nsICertOverrideService);
        var flags = 0;
        if(SSLP.gSSLStatus.isUntrusted)
          flags |= overrideService.ERROR_UNTRUSTED;
        if(SSLP.gSSLStatus.isDomainMismatch)
          flags |= overrideService.ERROR_MISMATCH;
        if(SSLP.gSSLStatus.isNotValidAtThisTime)
          flags |= overrideService.ERROR_TIME;
        
        var onlyTemporary = !gPrefService.getBoolPref("extensions.sslpersonas.permanent_exception");
        
        overrideService.rememberValidityOverride(
          uri.asciiHost, uri.port,
          SSLP.gCert,
          flags,
          onlyTemporary); 

        // Eat the event
        event.stopPropagation();

        // Reload the page
        if(errorDoc && errorDoc.location)
          errorDoc.location.reload();
      } 
	
      else if (ot == errorDoc.getElementById('SSLPgetMeOutOfHereButton')) {
    	  getMeOutOfHere();
      }
      else {
    	 // does not work for versions >  firefox 4b4
        //BrowserOnCommand(event); d
      }
    /**
     * Re-direct the browser to a known-safe page.  This function is
     * used when the user is directed to a certificate error page.  
     * The "Get me out of here!"
     * button should take the user to the default start page so that even
     * when their own homepage is infected, we can get them somewhere safe.
     */
    function getMeOutOfHere() {
      // Get the start page from the *default* pref branch, not the user's
      var prefs = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefService).getDefaultBranch(null);
      var url = "about:blank";
      try {
        url = "https://www.google.com"
       } catch(e) {
        Components.utils.reportError("Couldn't get homepage pref: " + e);
      }
      content.location = url;
    }      
}

//Simple badcertlistener lifted from exceptionDialog.js in PSM
SSLP.badCertListener = function() {}
SSLP.badCertListener.prototype = {
  getInterface: function (aIID) {
    return this.QueryInterface(aIID);
  },
  QueryInterface: function(aIID) {
    if (aIID.equals(Components.interfaces.nsIBadCertListener2) ||
        aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
        aIID.equals(Components.interfaces.nsISupports))
      return this;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },
  handle_test_result: function () {
    if (SSLP.gSSLStatus)
      SSLP.gCert = SSLP.gSSLStatus.QueryInterface(Components.interfaces.nsISSLStatus).serverCert;
  },
  notifyCertProblem: function MSR_notifyCertProblem(socketInfo, sslStatus, targetHost) {
    SSLP.gBroken = true;
    SSLP.gSSLStatus = sslStatus;
    this.handle_test_result();
    return true; // suppress error UI
  }
}


/**
 * this is needed for the likely case when the user chooses
 * another default persona. It is handled by 
 * SSLP.SSLPersona.onLightweightThemeChanged.
 */
SSLP.Observer = function(topic, callback, thisObject) {
  this.topic = topic;
  this.callback = callback;
  this.thisObject = thisObject;
}
SSLP.Observer.prototype = {
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver, Ci.nsISupportsWeakReference]),
  observe: function(subject, topic, data) {
    if (typeof this.callback == "function") {
      if (this.thisObject)
        this.callback.call(this.thisObject, subject, data);
      else
        this.callback(subject, data);
    }
    else // typeof this.callback == "object" (nsIObserver)
      this.callback.observe(subject, topic, data);
  }
}


/**
 * this observer is needed to watch preference changes
 * -> does the user activate the default strata theme?
 */
SSLP.PrefObserver = {
  register: function() {
    // First we'll need the preference services to look for preferences.
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);

    this._branch = prefService.getBranch("lightweightThemes.");
    this._sslpersonasbranch = prefService.getBranch("extensions.sslpersonas.");
    try{
    	SSLP.gIsThemeSelected = this._branch.getBoolPref("isThemeSelected");
    }
    catch(ex){ SSLP.gIsThemeSelected = false};

    // Now we queue the interface called nsIPrefBranch2. This interface is described as:  
    // "nsIPrefBranch2 allows clients to observe changes to pref values."
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this._sslpersonasbranch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    // Finally add the observer.
    this._branch.addObserver("", this, false);
    this._sslpersonasbranch.addObserver("", this, false);
  },

  unregister: function() {
    if (!this._branch) return;
    this._branch.removeObserver("", this);
    this._sslpersonasbranch.removeObserver("",this);
  },

  observe: function(aSubject, aTopic, aData) {
    if(aTopic != "nsPref:changed") return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)
    if (aSubject == this._sslpersonasbranch){
    	SSLP.SSLPersonas.refreshPersonas();
    	return;
    }
    switch (aData) {
      case "isThemeSelected":
        SSLP.gIsThemeSelected = this._branch.getBoolPref(aData);
        break;
    }
  }
}



/**
 * 
 * The main class.
 * by
 * Tobi Stockinger 2010;
 * 
 * This is where the magic happens
 * -Personas are changed according to the SSL state 
 * -The Menu is initialized
 * -it makes sure that there is a clean exit where the persona is reset to default
 */
SSLP.SSLPersonas = {
	lastCertState: null, // to hold certificate information;
	lastTabState: null, // to hold security state information (SSL)
	  prefs: null, // preference mangager service;
	  broken: null, // persona (JSON) for broken SSL
	  normal: null, // persona (JSON) for standard SSL
	  toplevel: null, // persona (JSON) for toplevel, extended verification SSL
	  lwt_observer: null, // observer for theme changes
	  init: function() {
		
		/*try{
			
			if(!gPrefService.getBoolPref("extensions.personas.perwindow")){
				gPrefService.setBoolPref("extensions.personas.perwindow",true);
			}
		}
		catch(e){
			Cu.reportError("No such Preference Branch: extensions.personas.perwindow");
		}*/
		
		
		try{
			if(gPrefService.prefHasUserValue("general.skins.selectedSkin"))
				gPrefService.clearUserPref("general.skins.selectedSkin") // sorry bro.
		}
		catch(e){
			Cu.reportError(e)
		}
		
		
		
		
		
		// register pref observer
		// this one listens on lightweightThemes.isThemeSelected
		SSLP.PrefObserver.register();	
		
		
		var p = Components.classes ["@mozilla.org/preferences-service;1"]
		                                .getService(Components.interfaces.nsIPrefService)
		                                .getBranch("extensions.sslpersonas.");
		this.prefs = p; // set preferences instance variable;	
		/**
		 * reading default preferences
		 */
		this.refreshPersonas();
	    
		if(!gPrefService.prefHasUserValue("lightweightThemes.usedThemes")){
			LWTM.currentTheme = this.standard;
			this.setThemeSelected(false);
		}
		
		this.setDefaultPersona();
		
		this.lwt_observer = new SSLP.Observer("lightweight-theme-changed",this.onLightweightThemeChanged, this);
		observerService.addObserver(this.lwt_observer,"lightweight-theme-changed",true);
		
		// only in Firefox > 3.5
		gBrowser.addTabsProgressListener(SSLP.sslp_listener,Ci.nsIWebProgress.NOTIFY_ALL);	
		gBrowser.tabContainer.addEventListener("TabSelect",SSLP.tabChangeListener,false);
		
	
		
		
		
		//gBrowser.removeEventListener("command", BrowserOnCommand, false);
	    gBrowser.addEventListener("command", SSLP.onCommand, false);
	    document.getElementById("content").addEventListener("DOMLinkAdded", SSLP.onCommand, false);
		   
	    
	    //this.initMenu(); // initialise the SSLPersonas-Menu Item.
	    
	  },
	  defaultPersona: null, // the startup theme
	  currentPersona: null, // persona that we are wearing at the moment
	  setDefaultPersona: function(){
		  this.defaultPersona = LWTM.currentTheme;
	  },
	  setThemeSelected: function(selected){
		  gPrefService.setBoolPref("lightweightThemes.isThemeSelected",selected);
	  },
	  refreshPersonas: function(){
		  this.broken = JSON.parse(this.prefs.getCharPref("broken"));
		  this.normal = JSON.parse(this.prefs.getCharPref("normal"));
		  this.toplevel = JSON.parse(this.prefs.getCharPref("toplevel"));
		  this.standard = JSON.parse(this.prefs.getCharPref("standard"));
	  },
	  
	  /**
	   * The next function is the core of the extension.
	   * it changes the persona according to
	   * @param index : tab-index;
	   * @param state: hex code of the security state
	   * 
	   */
	  sslStateHandler: function(index, state){
		//var browser = gBrowser.getBrowserAtIndex(index);
		//var tab = gBrowser.tabContainer.getItemAtIndex(index);
		var currentIndex = gBrowser.tabContainer.selectedIndex;
		
		
		
		/**
		 * if the state-change event was not fired from the 
		 * currently selected tab, we DO NOT
		 * change the Persona!
		 */
		if(index != currentIndex){
			return true;
		}
		if(!state){
			return false;
		}
		if(state == this.lastTabState){ // nothing to do;
			return true;
		}
		
		this.currentPersona = LWTM.currentTheme;
		
		this.lastTabState = state; // we can set the current state now.

		var curURI = gBrowser.getBrowserAtIndex(index).currentURI.spec;
		var isSSL = /^https:/i.test(curURI);
		
		/**
		 * we use binary operators to compare the states.
		 * to make it a little more efficient,
		 * only try to change the persona,
		 * if the current persona does not represent the current state.
		 * but actually - this should not occur, since we return,
		 * whenever state == this.lastTabState;
		 */
		
		
		if ((pl_interface.STATE_IDENTITY_EV_TOPLEVEL & state) && isSSL) {
			if(!SSLP.gIsThemeSelected){
				this.setThemeSelected(true);
				LWTM.currentTheme = this.toplevel;
				this.setThemeSelected(false);
			}
			else if(this.currentPersona.id != this.toplevel.id){
				LWTM.currentTheme = this.toplevel;
			}
		} else if ((pl_interface.STATE_IS_SECURE & state) && isSSL) {
			if(!SSLP.gIsThemeSelected){
				this.setThemeSelected(true);
				LWTM.currentTheme = this.normal;
				this.setThemeSelected(false);
			}
			else if(state & pl_interface.STATE_SECURE_HIGH)
				if(this.currentPersona.id != this.normal.id){
					LWTM.currentTheme = this.normal;
			}
		} else if ((pl_interface.STATE_IS_BROKEN & state) && isSSL) {
			if(!SSLP.gIsThemeSelected){
				this.setThemeSelected(true);
				LWTM.currentTheme = this.broken;
				this.setThemeSelected(false);
			}
			else if(this.currentPersona.id != this.broken.id){
				LWTM.currentTheme = this.broken;
			}
		} else if (pl_interface.STATE_IS_INSECURE & state) {
			
			
			
			/** THIS:
			* if(this.currentPersona.id != this.defaultPersona.id){
			* could bring some more efficiency 
			* */
			
			if(SSLP.gIsThemeSelected){	
				if(this.defaultPersona.id != this.currentPersona.id)
					LWTM.currentTheme = this.defaultPersona;
			}
			else{
				LWTM.currentTheme = null;
				this.setThemeSelected(false);
			}
				
			//}
		}else {
			// state means something else, so don't react to it.
			if(SSLP.gIsThemeSelected)
				LWTM.currentTheme = this.defaultPersona;
			else{
				this.setThemeSelected(false);
				LWTM.currentTheme = null;
			}
			
			return false;
		}
		
		
		return true;
	  },
	  getRecentPersonas : function(aHowMany) {
		if (!aHowMany)
	      aHowMany = 4;
		var personas = new Array(aHowMany)
		for(i=0;i<aHowMany;i++)
			personas[i] = LWTM.usedThemes[i];
	    return personas;
	  },
	  /**
	   * 
	   * does not do anything at this point. 
	   * prototype for upcoming version
	   */
	  selectWindow: function(){
		 var windowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
		                                         .getService(Components.interfaces.nsIWindowMediator);
		 
		 var rcntWin = windowManager.getMostRecentWindow("navigator:browser");
		 

		  
		 var idx = rcntWin.gBrowser.tabContainer.selectedIndex;
		 var state = rcntWin.gBrowser.securityUI.state;
		 
		 var winid = rcntWin.name;
		 
		 //this.sslStateHandler(idx,state);
		 //Cu.reportError("window: "+winid+", index: "+idx+", state: "+state);
	  },
	  /*
	   * Callback for Changes on the Lightweight Theme. 
	   * (that were not caused by SSLPersonas)
	   */
	  onLightweightThemeChanged: function() {
		  var currentTheme = LWTM.currentTheme;
		    if(currentTheme){
		    	if(currentTheme.id != this.normal.id 
		    			&& currentTheme.id != this.toplevel.id
		    			&& currentTheme.id != this.broken.id){
		    		this.setDefaultPersona();
		    	}
		    }
	  },
	 getCert: function(uri,functionname) {
	    var req = new XMLHttpRequest();
	    try {
	      if(uri) {
	        req.open('GET', uri.prePath, false);
	        req.channel.notificationCallbacks = new SSLP.badCertListener();
	        req.send(null);
	      }
	    } catch (e) {
	      // We *expect* exceptions if there are problems with the certificate
	      // presented by the site.  Log it, just in case, but we can proceed here,
	      // with appropriate sanity checks
	      Components.utils.reportError(functionname+": Attempted to connect to a site with a bad certificate. " +
	                                   "This results in a (mostly harmless) exception being thrown. " +
	                                   "Logged for information purposes only: " + e);
	    } finally {
	      SSLP.gChecking = false;
	    }

	    if(req.channel && req.channel.securityInfo) {
	      const Ci = Components.interfaces;
	      SSLP.gSSLStatus = req.channel.securityInfo
	                      .QueryInterface(Ci.nsISSLStatusProvider).SSLStatus;
	      SSLP.gCert = SSLP.gSSLStatus.QueryInterface(Ci.nsISSLStatus).serverCert;
	    }
	 },
	 /**
	   * clean exit:
	   *  - restore the currently selected STANDARD persona,
	   *  - remove listeners
	   */
	  exit: function(){

		  try{
			currentPersona = LWTM.currentTheme;
			if(currentPersona.id != this.normal.id && currentPersona.id != this.broken.id && currentPersona.id != this.toplevel.id){
				// nothing to do
			}
			
			// there's something to do, because the user exited wearing an SSLPersona.
			// we need to select the lastSelected Persona, which is NOT an SSLPersona.
			else{
				
				var recentPersonas,ls0,ls1,ls2,ls3,ls4;
				try{
					var recentPersonas = this.getRecentPersonas(5);
					ls0 = recentPersonas[0];
					ls1 = recentPersonas[1];
					ls2 = recentPersonas[2];
					ls3 = recentPersonas[3];
					ls4 = recentPersonas[4];
				}
				catch(ex){
					alert(ex);
				}			
				if(ls0.id != this.normal.id && ls0.id != this.broken.id && ls0.id != this.toplevel.id){
					
					LWTM.currentTheme = ls0;
					
				}
				else if(ls1.id != this.normal.id && ls1.id != this.broken.id && ls1.id != this.toplevel.id){
					
					
					LWTM.currentTheme = ls1;
				}
				else if(ls2.id != this.normal.id && ls2.id != this.broken.id && ls2.id != this.toplevel.id){
				
					
					LWTM.currentTheme = ls2;
				}
				else if(ls3.id != this.normal.id && ls3.id != this.broken.id && ls3.id != this.toplevel.id){
				
					
					LWTM.currentTheme = ls3;
				}
				else if(ls4.id != this.normal.id && ls4.id != this.broken.id && ls4.id != this.toplevel.id){
					
					
					LWTM.currentTheme = ls4;
				}
				
				else{ // shouldn't happen as long as there's not more than 4 SSLPersonas
					
					LWTM.currentTheme = this.defaultPersona;
				}
			}
		  }
		  catch(e){
			  
		  }
		  finally{
			observerService.removeObserver(this.lwt_observer,"lightweight-theme-changed");
			gBrowser.removeTabsProgressListener(SSLP.sslp_listener);
			gBrowser.tabContainer.removeEventListener("TabSelect",SSLP.tabChangeListener, false);
			SSLP.PrefObserver.unregister();
		  }
	  },
	  
	  
	  /**
	   * @TODO use string-bundles!
	   */
	  openSettingsWindow: function(aEvent){
		window.openDialog("chrome://sslpersonas/content/prefwindow.xul","Einstellungen","resizable,dialog,centerscreen,modal");
	  },
	  openAboutWindow: function(aEvent){
		window.open("chrome://sslpersonas/content/about.xul","Informationen zu SSLPersonas","menubar=no,chrome,centerscreen");
	  }
}
window.addEventListener("load", function() { SSLP.SSLPersonas.init();}, false);
window.addEventListener("unload", function() {SSLP.SSLPersonas.exit();}, false);
//window.addEventListener("activate", function() {SSLP.SSLPersonas.selectWindow();},false);