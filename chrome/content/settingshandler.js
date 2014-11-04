// settingshandler wrapped into one JS object.

if ("undefined" == typeof(SSLP_settings)) {
	  var SSLP_settings = {
	    init : function() {
		  override_certerror = null; 
		  permanent_exception = null;
		  
		  /* set up shortcuts to XPCom*/
		  if (typeof Cc == "undefined")
		    Cc = Components.classes;
		  if (typeof Ci == "undefined")
		    Ci = Components.interfaces;
		  if (typeof Cr == "undefined")
		    Cr = Components.results;
		  if (typeof Cu == "undefined")
		    Cu = Components.utils;
		  prefservice = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		  sslpersonas_prefs = prefservice.getBranch("extensions.sslpersonas.");
		  security_prefs = prefservice.getBranch("security.");
	  	}
	  };

	  (function() {
	    this.init();
	  }).apply(SSLP_settings);
	};

SSLP_settings.checkListener = function(){
	override_certerror = document.getElementById("cb_override_certerror");
	permanent_exception = document.getElementById("cb_permanent_exception");
	
	if(!override_certerror.checked){
		permanent_exception.disabled = true;
	}
	else{
		permanent_exception.disabled = false;
	}
}

SSLP_settings.onLoad = function(){
	
	override_certerror = document.getElementById("cb_override_certerror");	
	permanent_exception = document.getElementById("cb_permanent_exception");
	
	if(!override_certerror.checked){
		permanent_exception.disabled = true;
	}	
	override_certerror.addEventListener("command",SSLP_settings.checkListener,false);
	return true;
}

SSLP_settings.selectPersona = function(event){
	var button = event.target;
	var id = button.id;
	var field;
	var doc;
	var ajaxloader = document.getElementById("ajaxloader");
	var jsonString;
	ajaxloader.style.display= "block";
	if(id == "toplevelChoice"){
		field = document.getElementById("toplevelURL");
	}
	else if(id == "standardChoice"){
		field = document.getElementById("standardURL");
	}
	else if(id == "brokenChoice"){
		field = document.getElementById("brokenURL");
	}
	
	var req = new XMLHttpRequest();
	if(field){
	    req.open('GET', field.value, true);
	    req.onreadystatechange = function (aEvt) {
	      if (req.readyState == 4) {
	         if(req.status == 200){
	        	 doc = req.responseText;
	        	 
	        	 var re = /persona="[\\{&#,;:_.\ -}\?\/a-zA-Z\d]*"/gi;
	        	 var attribute = "" + re.exec(doc);
	        	 
	        	 if(re.exec(doc) === null){
	        		 alert("Invalid URL: Only Personas from www.getpersonas.com are allowed.");
	        		 ajaxloader.style.display = "none";
	        		 return;
	        	 }
	        	 
	        	 
	        	 
	        	 var toReplace = /&#34;/gi;
	        	 var toReplace2 = /&quot;/gi;
	        	 
	        	 
	        	 
	        	 var escapedAttr = attribute.replace(toReplace2,'"');
	        	 
	        	 
	        	 
	        	 var jsonExtractor = /{[\\&#,;:_. \/\w"^\-\\+?!=()]*}/gi;
	        	 jsonString = "" + jsonExtractor.exec(escapedAttr);
	        	 
	        	 alert(jsonString);
	        	 
	        	 ajaxloader.style.display = "none";
	        	 
	        	 
	        	 
	        	 
	        	 if(id == "toplevelChoice"){
	        			sslpersonas_prefs.setCharPref("customToplevelUrl",field.value);
	        	   	 	sslpersonas_prefs.setCharPref("toplevel",jsonString);
	        	   	 	alert("Toplevel SSL Persona successfully changed");
	        		}
	        		else if(id == "standardChoice"){
	        			sslpersonas_prefs.setCharPref("customStandardUrl",field.value);
	        	   	 	sslpersonas_prefs.setCharPref("normal",jsonString);
	        	   	 	alert("Standard SSL Persona successfully changed");
	        		}
	        		else if(id == "brokenChoice"){
	        			sslpersonas_prefs.setCharPref("customBrokenUrl",field.value);
	        	   	 	sslpersonas_prefs.setCharPref("broken",jsonString);
	        	   	 	alert("Broken SSL Persona successfully changed");
	        		}
	         }
	         else{
	        	alert("Website could not be opened");
	         }
	      }
	    };
	    req.send(null);
	}
}

SSLP_settings.restorePersona = function(event){
	var button = event.target;
	var id = button.id;
	var field;
	if(id == "toplevelRestore"){
		try{
			sslpersonas_prefs.clearUserPref("toplevel");
			sslpersonas_prefs.clearUserPref("customToplevelUrl");
		}catch(ex){};
		field = document.getElementById("toplevelURL")
	}
	else if(id == "standardRestore"){
		try{
		sslpersonas_prefs.clearUserPref("normal");
		sslpersonas_prefs.clearUserPref("customStandardUrl");
		}catch(ex){};
		field = document.getElementById("standardURL");
		
	}
	else if(id == "brokenRestore"){
		try{
			sslpersonas_prefs.clearUserPref("broken");
			sslpersonas_prefs.clearUserPref("customBrokenUrl");
		}catch(ex){};
		field = document.getElementById("brokenURL");
	}
	
	field.value = "";
}

SSLP_settings.dialogAccepted = function(){	
	if(override_certerror.checked){
		security_prefs.setCharPref("alternate_certificate_error_page","sslpersonas");
	}
	else{
		security_prefs.setCharPref("alternate_certificate_error_page","certerror");
	}
	return true;
}
