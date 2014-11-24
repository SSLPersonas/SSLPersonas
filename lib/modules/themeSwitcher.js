/**
 * Created by Tobi Stockinger on 21.11.14.
 */

// A module that lets you
function themeSwitcher(){
    // this makes the LightWeightThemeManager resource available.
    // we need it to change the LightWeightThemes, also know as Personas.
    var {Cu} = require('chrome');
    var sslStatus = require('./sslHandler.js').sslHandler.SSL_STATUS;
    var data = require('sdk/self').data;
    var cleanupReasons = {
        standardActive : 'standardActive'
    };

    // Implitctly declared: var LightWeightThemeManger
    Cu.import('resource://gre/modules/LightweightThemeManager.jsm');

    /**
     * Constants for available themes.
     * @type {{extendedValidation: Theme, standardValidation: Theme, noSSL: Theme}}
     */
    this.theme = {};
    this.theme.defaultTheme = new Theme('standard','Standard');
    this.theme[sslStatus.extendedValidation] = new Theme('ev','Extended Validation Certificate Theme', data.url('img/themes/extendedValidation.png'));
    this.theme[sslStatus.standardValidation] = new Theme('sv','Standard Validation Certificate Theme', data.url('img/themes/standardValidation.png'));
    this.theme[sslStatus.insecureConnection] = new Theme('http','Insecure Connection Theme', data.url('img/themes/insecureConnection.png'));
    this.theme[sslStatus.brokenCertificate]  = new Theme('https','Broken Certificate Theme', data.url('img/themes/brokenCertificate.png'));
    this.theme[sslStatus.otherProtocol]      = new Theme('standard','Standard');



    /**
     *
     * @param theme object of type {id:?,name:?,headerURL:?}
     */
    this.switchToTheme = function(theme){
        if(theme && typeof theme  != 'undefined'){
            LightweightThemeManager.themeChanged(theme);
            // it doesn't happen that often, to switch to the
            // default theme.
            // let's use this opportunity to quickly clean up
            // after our add on.
            if(theme.id == this.theme.defaultTheme.id){
                this.cleanUpSSLPersonasThemes(cleanupReasons.standardActive);
            }
        }
    };



    /**
     * we do not want to leave any traces.
     * That's why we tell the theme manager
     * to forget all our themes.
     * This might be called onUninstall or even onClose.
     */
    this.cleanUpSSLPersonasThemes = function(reason){
        var self = this;
        var themeNames = Object.keys(this.theme);
        console.log('cleaning up themes. Reason: ' + reason);

        // on each clean up we restore the default theme
        // is restoring the default theme.
        // don't do this with this.switchToTheme, because this might
        // lead to recursion!
        if(typeof reason == 'undefined' || reason != cleanupReasons.standardActive){
            try{
                LightweightThemeManager.themeChanged(null);
            }
            catch(e){ // pokemon!
                // gotta catch 'em all.
            }
        }

        // iterate over all themes that are stored
        // in this.theme
        // do not remove: defaultTheme, otherProtool
        for(var i=0;i<themeNames.length;i++){
            (function(name){
                if(typeof name != 'undefined' && name != 'defaultTheme'){
                    LightweightThemeManager.forgetUsedTheme(self.theme[name].id);
                }
            })(themeNames[i]);
        }


    };

    /**
     * An Object wrapper for a lightweight theme.
     * @param id a randomly chosen string that will not be shown to the user
     * @param name a name for the theme that will appear in the theme selection.
     * @param headerURL a path or URL to an image that's large enough to span the entire chrome.
     */
    function Theme(id,name,headerURL){
        var additionalInfo = 'SSLPersonas';
        this.id = id;
        this.name = additionalInfo + ": " + name;

        // if headerURL is null, the LightWeightThemeManager
        // reverts to Firefox's defaul theme!
        this.headerURL = headerURL;
        this.author = additionalInfo;
    }



}

exports.themeSwitcher = new themeSwitcher();