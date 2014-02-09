var $crtTab = $('#tab-1');

$('ul.menu li').click(function (e) {
    /* changes tabs;
     * saves scroll context
     * calls init function (data-function) the first time
     */

    var $t = $(this);
    var tabID = $t.data('tab');
    var $newTab = $('#' + tabID);
    var $tabContainer = $('#tab-container');
    var tabName = $t.text().toLowerCase();

    addNavigationSegment(tabName);

    if (tabID == 'github') {
        window.location.href = 'https://github.com/ubervu/elasticboard/';
        return;
    }

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

/*
* Add a new segment to the navigation
* <user>/<repo>/page
*/
function addNavigationSegment (segment) {

    var href = location.href.split('/');
    if (href.length > 6) {
        // remove last segment from previous tab
        href.pop();
    }

    location.href = href.join('/') + '/' + segment;

}