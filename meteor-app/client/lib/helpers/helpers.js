Helpers = {
  $alerts: null,
  $currentOverlay: null,
  $github: null,
  $overlayLogin: null,
  transEndEventName: null,

  init: function () {
    var _this = this;

    _this.$alerts = $('.alerts ul');
    _this.$github = $('.github-banner img');
    _this.$overlayLogin = $('#overlay-login');

    _this.setOverlay(_this.$overlayLogin);

    _this.transEndEventNames = {
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'oTransitionEnd',
      'msTransition': 'MSTransitionEnd',
      'transition': 'transitionend'
    };
    _this.transEndEventName = _this.transEndEventNames[ Modernizr.prefixed( 'transition' ) ];

    window.onscroll = function (e) {
      if (!_this.$github.length) return;

      var top = window.pageYOffset || document.documentElement.scrollTop;
      if (top) _this.$github.css('top', '-100px');
      else _this.$github.css('top', 0);
    }
  },

  animateOutput: function ($item) {
    $item.on('click', function() {
      $item.addClass('transparent');
      setTimeout(function() {
        $item.remove();
      },1000);
    });
    setTimeout(function() {
      $item.removeClass('transparent');
      setTimeout(function() {
        $item.addClass('transparent');
        setTimeout(function() {
          $item.remove();
        }, 1000);
      },5000);
    },100);
  },

  createAccount: function (email, password) {
    var _this = this;

    if (!password || password.length < 5)
      _this.outputErrors("Your password needs to be at least 5 characters.");
    else {
      Accounts.createUser({email: email, password: password}, function (error) {
        if (error) _this.outputErrors(error);
        else {
          Meteor.loginWithPassword({email: email}, password, function (error) {
            if (error) _this.outputErrors(error);
            else _this.outputSuccess('Your account has been created.');
            _this.toggleOverlay();
          });
        }
      });
    }
  },

  outputErrors: function (error) {
    var _this = this,
      msg = "";

    if (error) {
      if (error.reason) // Account creation error
        msg = error.reason;
      else
        msg = error;

      var $item = $('<li class="alert alert-danger alert-dismissable transparent"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + msg + '</li>').appendTo(_this.$alerts);
      _this.animateOutput($item);
    }
  },

  outputSuccess: function (msg) {
    var _this = this;
    var item = $('<li class="alert alert-success alert-dismissable transparent"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + msg + '</li>').appendTo(_this.$alerts);

    _this.animateOutput(item);
  },

  setOverlay: function ($overlay) {
    var _this = this;

    if (!$overlay) return;

    $overlay.find( '[data-action="overlay-close"]').on('click', function() { _this.toggleOverlay($overlay); });
    $overlay.find('.overlay-content').on('click', function(e) { e.stopPropagation(); });
    $overlay.on('click', function() { _this.toggleOverlay($overlay); });
  },

  toggleOverlay: function ($overlay) {
    var _this = Helpers;
    
    if (!$overlay && !_this.$currentOverlay) return;

    if (!$overlay) $overlay = _this.$currentOverlay;
    else _this.$currentOverlay = $overlay;

    if ($overlay.hasClass('open') || $overlay.hasClass('close')) {
      $overlay.removeClass('open');
      $overlay.addClass('close');

      var onEndTransitionFn = function(ev) {
        if (Modernizr.csstransitions) {
          if( ev.propertyName !== 'visibility' ) return;
          this.removeEventListener(_this.transEndEventName, onEndTransitionFn);
        }
        $overlay.removeClass('close');
      };

      if (Modernizr.csstransitions) {
        $overlay[0].addEventListener(_this.transEndEventName, onEndTransitionFn);
      }
      else {
        onEndTransitionFn();
      }
    }
    else if (!$overlay.hasClass('close')) {
      $overlay.addClass('open');
    }
  },

  empty: null
};