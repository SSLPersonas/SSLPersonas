/**
 * Created by Tobi Stockinger on 21.11.14.
 */

// A module that lets you
function themeSwitcher(){
    // this makes the LightWeightThemeManager resource available.
    // we need it to change the LightWeightThemes, also know as Personas.
    var {Cu} = require('chrome');
    var self = require('sdk/self');
    var sslStatus = require('./sslHandler.js').sslHandler.SSL_STATUS;
    var data = self.data;

    // Implitctly declared: var LightWeightThemeManger
    Cu.import('resource://gre/modules/LightweightThemeManager.jsm');

    /**
     *
     * @param theme object of type {id:?,name:?,headerURL:?}
     */
    this.switchToTheme = function(theme){
        LightweightThemeManager.themeChanged(theme);
    };

    /**
     * Constants for available themes.
     * @type {{extendedValidation: Theme, standardValidation: Theme, noSSL: Theme}}
     */
    this.theme = {};
    this.theme[sslStatus.extendedValidation] = new Theme('ev','Extended Validation Certificate Theme',data.url('img/extendedValidation.png'));
    this.theme[sslStatus.standardValidation] = new Theme('sv','Standard Validation Certificate Theme', data.url('img/standardValidation.png'));
    this.theme[sslStatus.insecureConnection] = new Theme('http','HTTP Theme');
    this.theme[sslStatus.brokenCertificate]  = new Theme('http','HTTP Theme'); // TODO we could opt for a different one here.
    this.theme[sslStatus.otherProtocol]      = new Theme('standard','Standard Theme');

    /**
     * An Object wrapper for a lightweight theme.
     * @param id a randomly chosen string that will not be shown to the user
     * @param name a name for the theme that will appear in the theme selection.
     * @param headerURL a path or URL to an image that's large enough to span the entire chrome.
     */
    function Theme(id,name,headerURL){
        this.id = id;
        this.name = name;
        this.headerURL = headerURL;
    }
}

exports.themeSwitcher = new themeSwitcher();