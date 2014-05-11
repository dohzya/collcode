var Q = require('q');
var _ = require('lodash');
var marked = require('marked');

var Firepad = require('./firepad');

(function (window, undefined) {
  "use strict";

  var document = window.document;
  var ace = window.ace;
  var sessionStorage = window.sessionStorage;

  var Collcode = {};

  marked.setOptions({
    renderer: new marked.Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  function autoRefFromHash() {
    // Get hash from end of URL or generate a random one.
    var ref = new Firebase('https://code-dohzya.firebaseIO.com');
    var hash = window.location.hash.replace(/#/g, '');
    if (hash) {
      ref = ref.child(hash);
    } else {
      ref = ref.push(); // generate unique location.
      window.location = window.location + '#' + ref.name(); // add it as a hash to the URL.
    }
    return ref;
  }

  function kill(ctx) {
    ctx.firebase.remove();
    window.location.hash = "";
    document.querySelector('body').classList.add('killed');
    document.querySelector('#new').addEventListener('click', function () {
      window.location.reload();
    });
  }

  function changeKeybinding(ctx, keybinding) {
    var handler;
    if (keybinding == 'ace') {
      handler = ctx.defaultKeyboardHandler;
    } else {
      handler = ace.require("ace/keyboard/"+keybinding).handler;
    }
    ctx.editor.setKeyboardHandler(handler);
    ctx.keybinding = keybinding;
    ctx.optsKeybinding.value = ctx.keybinding;
    sessionStorage.setItem("keybinding", keybinding);
  }

  function notifyMode(ctx) {
    ctx.firebase.update({mode: ctx.mode});
  }

  function changeMode(ctx, mode, notify) {
    ctx.session.setMode("ace/mode/"+mode);
    ctx.mode = mode;
    ctx.optsMode.value = ctx.mode;
    if (notify) {
      notifyMode(ctx);
    }
  }

  function changeTheme(ctx, theme) {
    ctx.editor.setTheme("ace/theme/"+theme);
    ctx.theme = theme;
    ctx.optsTheme.value = ctx.theme;
    sessionStorage.setItem("theme", theme);
  }

  function init() {
    var ctx = Collcode;

    var opts = document.querySelector('#options');
    ctx.optsKeybinding = opts.querySelector('[name="keybinding"]');
    ctx.optsKeybinding.addEventListener('change', function () {
      changeKeybinding(ctx, ctx.optsKeybinding.value);
    });

    ctx.optsMode = opts.querySelector('[name="mode"]');
    ctx.optsMode.addEventListener('change', function () {
      changeMode(ctx, ctx.optsMode.value, true);
    });

    ctx.optsTheme = opts.querySelector('[name="theme"]');
    ctx.optsTheme.addEventListener('change', function () {
      changeTheme(ctx, ctx.optsTheme.value);
    });

    document.querySelector('#kill').addEventListener('click', function () {
      kill(ctx);
    });

    ctx.firebase = autoRefFromHash();
    ctx.editor = ace.edit("editor");
    ctx.defaultKeyboardHandler = ctx.editor.getKeyboardHandler();
    var theme = sessionStorage.getItem("theme") || 'ambiance';
    changeTheme(ctx, theme);
    var keybinding = sessionStorage.getItem("keybinding") || 'ace';
    changeKeybinding(ctx, keybinding);
    ctx.session = ctx.editor.getSession();
    ctx.session.setUseWrapMode(true);
    ctx.session.setUseWorker(false);

    var received = false;
    ctx.firebase.on('value', function(snapshot) {
      var message = snapshot.val();
      received = true;
      if (message.mode) {
        changeMode(ctx, message.mode);
      }
    });

    changeMode(ctx, 'scala', false);

    setTimeout(function () {
      if (!received) {
        notifyMode(ctx);
      }
    }, 5000);

    ctx.firepad = Firepad.fromACE(ctx.firebase, ctx.editor);

  }

  Collcode.init = init;

  window.Collcode = Collcode;

}(window));
