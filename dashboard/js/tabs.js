var $crtTab = $('#tab-1');

$('ul.menu li').click(function (e) {
    /* changes tabs;
     * saves scroll context
     * calls init function (data-function) the first time
     */

    $t = $(e.target);
    var tabID = $t.data('tab');
    var $newTab = $('#' + tabID);
    var $tabContainer = $('#tab-container');

    var scroll = $crtTab.scrollTop();
    $crtTab.data('scroll', scroll);

    $crtTab.hide();
    $newTab.show();

    var newScroll = $newTab.data('scroll');
    if (!newScroll) {
        $newTab.scrollTop(0);
    }

    $crtTab.data('init', true);

    // call function (if any)
    var fname = $t.data('function');
    if (fname && !$newTab.data('init')) {
        window[fname]();
    }

    $crtTab = $newTab;
});

