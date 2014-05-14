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
    var creator;
    if (hash) {
      ref = ref.child(hash);
      creator = false;
    } else {
      ref = ref.push(); // generate unique location.
      creator = true;
      window.location = window.location + '#' + ref.name(); // add it as a hash to the URL.
    }
    return [ref, creator];
  }

  function kill(ctx, notified) {
    if (notified) {  // we receive the notif
      window.location.hash = "";
      document.querySelector('body').className = 'killed';
      if (ctx.sente) {  // we receive the notif because we kill
        ctx.killed = true;
        ctx.firebase.remove();  // remove it asap from server
      }
    } else {  // we kill
      ctx.sente = true;
      document.querySelector('body').className = 'killing';
      ctx.firebase.update({kill: true});
      setTimeout(function () {
        if (!ctx.killed) {  // we didn't receive the notif from our kill
          ctx.firebase.remove();
          window.location.hash = "";
          document.querySelector('body').className = 'killed';
        }
      }, 2000);
    }
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

  function preview(ctx) {
    var value = ctx.editor.getValue();
    ctx.preview.innerHTML = marked(value);
  }

  function showPreview(ctx, show) {
    ctx.showPreview = show;
    if (show) {
      preview(ctx);
      document.querySelector('body').classList.add('preview');
    } else {
      document.querySelector('body').classList.remove('preview');
    }
  }

  function changeMode(ctx, mode, notify) {
    ctx.session.setMode("ace/mode/"+mode);
    ctx.mode = mode;
    ctx.optsMode.value = ctx.mode;
    showPreview(ctx, mode == 'markdown');
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

    var opts = document.querySelector('#cc-options');
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

    document.querySelector('#cc-kill').addEventListener('click', function () {
      if (window.confirm("Do you really to kill the doc?\n(it will be destroyed for everyone)")) {
        kill(ctx);
      }
    });

    document.querySelector('#cc-new').addEventListener('click', function () {
      window.location = window.location.toString().replace(/#.*/, '');
    });

    ctx.preview = document.querySelector('#cc-preview');
    ctx.showPreview = false;

    var autoRef = autoRefFromHash();
    ctx.firebase = autoRef[0];
    ctx.creator = autoRef[1];

    ctx.editor = ace.edit("cc-editor");
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
      if (!message) {
        // do nothing
      } else if (message.kill) {
        kill(ctx, true);
      } else if (message.mode) {
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

    ctx.editor.on("change", function (evt, editor) {
      if (ctx.showPreview) {
        preview(ctx);
      }
    });

    var statusBar = document.querySelector('#cc-statusbar');
    var changed = true;
    var sel = ctx.editor.getSelection();
    function updateLines(sel) {
      var mode;
      var ranges = sel.getAllRanges();
      var lines;
      var regions = ranges.length;
      if (regions > 1) {
        mode = "region";
      } else {
        var range = ranges[0];
        if (_.isEqual(range.start, range.end)) {
          mode = "cursor";
        } else {
          mode = "selection";
          lines = range.end.row - range.start.row + 1;
        }
      }
      var cur = ctx.editor.getCursorPosition();
      var str = _.compact([
        mode == "cursor" ? "Line " + cur.row : null,
        mode == "cursor" ? "Column " + cur.column : null,
        mode == "selection" ? lines + " lines selected" : null,
        mode == "region" ? regions + " selection regions" : null,
      ]).join(", ");
      statusBar.innerHTML = str;
    }
    function loopUpdateLines() {
      updateLines(sel);
      setTimeout(loopUpdateLines, 100);
    }
    loopUpdateLines();
    sel.on("changeSelection", function () {
      updateLines(sel);
    });

    window.onbeforeunload = function () {
      if (ctx.creator && !ctx.killed) {
        return "You haven't kill the buffer";
      }
    };

  }

  Collcode.init = init;

  window.Collcode = Collcode;

}(window));
