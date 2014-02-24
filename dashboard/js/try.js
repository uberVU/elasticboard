/* globals $, Bloodhound */

'use strict';

var $repo = $('.input--repository');
var data;

$repo.on('keyup', function() {

  var repoName = $(this).val();

  if (window._timeout) {
    clearTimeout(window._timeout);
  }
  window._timeout = setTimeout(function() {
    selectedRepo(repoName);
  }, 300);

});

$('.input--owner').on('focusout', function() {
  var owner = $(this).val();
  var url = 'https://api.github.com/users/' + owner + '/repos?per_page=1000';

  if (!owner) {
    showModal({
      title: 'No username',
      body: 'You did not write a username'
    });

    $(this).focus();
    return;
  }

  $.get(url)
  .success(autocompleteRepos)
  .fail(handleFail);

});

function selectedRepo(repoName) {

  if (!data) return; // data has not loaded just yet

  if (data.some(equal(repoName))) {
    // show dashboard link
    $repo.typeahead('destroy');
    var container = $('.form');
    container.removeClass('hide-link').addClass('show-link');
  }

}

function equal(val) {
  return function (obj) {
    return obj.name == val;
  };
}

function autocompleteRepos(d) {

  if (!d.length) {
      showModal({
        title: 'No repositories found',
        body: 'Check out the existing repos in the dashboard'
      });
      $(window).on('click', function() {
        $(window).off('click');
        toggleModal();
      });
    return;
  }

  data = d;

  var numbers = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: data
  });

  numbers.initialize();

  $repo.typeahead(null, {
    displayKey: 'name',
    source: numbers.ttAdapter()
  });

  $repo.focus();
}

function handleFail() {
  showModal({
    title: 'Could not get your repos',
    body: 'Did you type in the correct GitHub username?'
  });
  $(window).on('click', function() {
    $(window).off('click');
    toggleModal();
  });
}

function showModal(msg) {
  var $modal = $('#modal');
  $('h2', $modal).text(msg.title);
  $('p', $modal).text(msg.body);
  toggleModal();
}

function toggleModal() {
  var $modal = $('#modal');
  $modal.toggleClass('modal-window--hidden');
}

$('#close-modal').on('click', function() {
  toggleModal();
});