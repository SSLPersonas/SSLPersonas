const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function AboutSslPersonas() {
}
AboutSslPersonas.prototype = {
  classDescription: "about:sslpersonas",
  contractID: "@mozilla.org/network/protocol/about;1?what=sslpersonas",
  classID: Components.ID("{e74e644d-9e8e-a138-af93-4c3c17a8aeb8}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIAboutModule,Ci.nsISupportsWeakReference]),
  
  getURIFlags: function(aURI){
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  },
  
  newChannel : function(aURI)
  {
    if(!aURI.spec == "about:sslpersonas") return;
    var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    var channel = ios.newChannel("chrome://sslpersonas/content/certerror.xhtml", null, null);
    channel.originalURI = aURI;
    return channel;
  }

  
};

/**
 * 
 * thx to kbrosnan and AboutWeaveTabs Addon.
 */

//Gecko <2.0
function NSGetModule(compMgr, fileSpec) {
  return XPCOMUtils.generateModule([ AboutSslPersonas ]);
}

// Gecko >=2.0
if (typeof XPCOMUtils.generateNSGetFactory == "function")
  const NSGetFactory = XPCOMUtils.generateNSGetFactory([ AboutSslPersonas ]);
