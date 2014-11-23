/**
 * Created by tobi on 23/11/14.
 */

$(document).ready(function(){
    function toggleSecure(e){
        e.preventDefault();
        var container = $('#securityDescription');
        var short = container.find('.short');
        var long = container.find('.long');
        var duration = 400;
        short.fadeToggle(duration);
        long.slideToggle(duration);
    }

    function init(){


        var readOnSecurity = $('a.readOn.securityDescription');
        readOnSecurity.click(toggleSecure);
    }

    // go!
    init();
});
