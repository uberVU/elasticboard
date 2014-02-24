/* globals $, Bloodhound */

'use strict';

var $repo = $('.input--repository');
var data;
var user_data = {
  owner: '',
  repository: ''
};

$('#temporary-dashboard').on('click', function() {
  $.post('http://' + location.hostname + ':5000/add_temporary_river', user_data)
    .success(showRedirectModal)
    .fail(function(data) {
      console.log(data);
        showModal({
          title: 'Could not set things up :(',
          body: 'Please try again or <a href="/">check out the existing repos</a> in the dashboard'
        });
        $(window).on('click', function() {
          $(window).off('click');
          toggleModal();
        });
    });
});

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

  user_data.owner = owner;

  $.get(url)
  .success(autocompleteRepos)
  .fail(handleFail);

});

function selectedRepo(repoName) {

  if (!data) return; // data has not loaded just yet

  if (data.some(equal(repoName))) {
    // show dashboard link
    user_data.repository = repoName;
    $repo.typeahead('destroy');
    var $container = $('.form');
    $('input', $container).attr('disabled', true);
    $container.removeClass('hide-link').addClass('show-link');
  }

}

function showRedirectModal() {
  showModal({
    title: 'Please wait while we set things up',
    body: 'We are fetching the data from ' + user_data.repository + ' just for you! We will redirect you when it is ready.'
  });
  $('#modal').removeClass('modal-window--error').addClass('modal-window--success');
  setTimeout(function(){
    location.href = location.origin;
  }, 3000);
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
        body: 'Try with a different owner or check out <a href="#">the existing repos</a> in the dashboard'
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

function handleFail(data) {
  console.log(data);
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
  $('p', $modal).html(msg.body);
  toggleModal();
}

function toggleModal() {
  var $modal = $('#modal');
  $modal.toggleClass('modal-window--hidden');
}

$('#close-modal').on('click', function() {
  toggleModal();
});