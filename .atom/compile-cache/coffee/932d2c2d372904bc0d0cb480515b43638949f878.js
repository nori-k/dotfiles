(function() {
  var CompositeDisposable, Emitter, ListView, TermView, Terminals, capitalize, config, getColors, keypather, path;

  path = require('path');

  TermView = require('./lib/term-view');

  ListView = require('./lib/build/list-view');

  Terminals = require('./lib/terminal-model');

  Emitter = require('event-kit').Emitter;

  keypather = require('keypather')();

  CompositeDisposable = require('event-kit').CompositeDisposable;

  capitalize = function(str) {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  };

  getColors = function() {
    var background, brightBlack, brightBlue, brightCyan, brightGreen, brightPurple, brightRed, brightWhite, brightYellow, foreground, normalBlack, normalBlue, normalCyan, normalGreen, normalPurple, normalRed, normalWhite, normalYellow, _ref;
    _ref = (atom.config.getAll('term3.colors'))[0].value, normalBlack = _ref.normalBlack, normalRed = _ref.normalRed, normalGreen = _ref.normalGreen, normalYellow = _ref.normalYellow, normalBlue = _ref.normalBlue, normalPurple = _ref.normalPurple, normalCyan = _ref.normalCyan, normalWhite = _ref.normalWhite, brightBlack = _ref.brightBlack, brightRed = _ref.brightRed, brightGreen = _ref.brightGreen, brightYellow = _ref.brightYellow, brightBlue = _ref.brightBlue, brightPurple = _ref.brightPurple, brightCyan = _ref.brightCyan, brightWhite = _ref.brightWhite, background = _ref.background, foreground = _ref.foreground;
    return [normalBlack, normalRed, normalGreen, normalYellow, normalBlue, normalPurple, normalCyan, normalWhite, brightBlack, brightRed, brightGreen, brightYellow, brightBlue, brightPurple, brightCyan, brightWhite, background, foreground].map(function(color) {
      return color.toHexString();
    });
  };

  config = {
    autoRunCommand: {
      type: 'string',
      "default": ''
    },
    titleTemplate: {
      type: 'string',
      "default": "Terminal ({{ bashName }})"
    },
    fontFamily: {
      type: 'string',
      "default": ''
    },
    fontSize: {
      type: 'string',
      "default": ''
    },
    colors: {
      type: 'object',
      properties: {
        normalBlack: {
          type: 'color',
          "default": '#2e3436'
        },
        normalRed: {
          type: 'color',
          "default": '#cc0000'
        },
        normalGreen: {
          type: 'color',
          "default": '#4e9a06'
        },
        normalYellow: {
          type: 'color',
          "default": '#c4a000'
        },
        normalBlue: {
          type: 'color',
          "default": '#3465a4'
        },
        normalPurple: {
          type: 'color',
          "default": '#75507b'
        },
        normalCyan: {
          type: 'color',
          "default": '#06989a'
        },
        normalWhite: {
          type: 'color',
          "default": '#d3d7cf'
        },
        brightBlack: {
          type: 'color',
          "default": '#555753'
        },
        brightRed: {
          type: 'color',
          "default": '#ef2929'
        },
        brightGreen: {
          type: 'color',
          "default": '#8ae234'
        },
        brightYellow: {
          type: 'color',
          "default": '#fce94f'
        },
        brightBlue: {
          type: 'color',
          "default": '#729fcf'
        },
        brightPurple: {
          type: 'color',
          "default": '#ad7fa8'
        },
        brightCyan: {
          type: 'color',
          "default": '#34e2e2'
        },
        brightWhite: {
          type: 'color',
          "default": '#eeeeec'
        },
        background: {
          type: 'color',
          "default": '#000000'
        },
        foreground: {
          type: 'color',
          "default": '#f0f0f0'
        }
      }
    },
    scrollback: {
      type: 'integer',
      "default": 1000
    },
    cursorBlink: {
      type: 'boolean',
      "default": true
    },
    shellOverride: {
      type: 'string',
      "default": ''
    },
    shellArguments: {
      type: 'string',
      "default": (function(_arg) {
        var HOME, SHELL;
        SHELL = _arg.SHELL, HOME = _arg.HOME;
        switch (path.basename(SHELL && SHELL.toLowerCase())) {
          case 'bash':
            return "--init-file " + (path.join(HOME, '.bash_profile'));
          case 'zsh':
            return "-l";
          default:
            return '';
        }
      })(process.env)
    },
    openPanesInSameSplit: {
      type: 'boolean',
      "default": false
    }
  };

  module.exports = {
    termViews: [],
    focusedTerminal: false,
    emitter: new Emitter(),
    config: config,
    disposables: null,
    activate: function(state) {
      this.state = state;
      this.disposables = new CompositeDisposable();
      if (!process.env.LANG) {
        console.warn("Term3: LANG environment variable is not set. Fancy characters (å, ñ, ó, etc`) may be corrupted. The only work-around is to quit Atom and run `atom` from your shell.");
      }
      ['up', 'right', 'down', 'left'].forEach((function(_this) {
        return function(direction) {
          return _this.disposables.add(atom.commands.add("atom-workspace", "term3:open-split-" + direction, _this.splitTerm.bind(_this, direction)));
        };
      })(this));
      this.disposables.add(atom.commands.add("atom-workspace", "term3:open", this.newTerm.bind(this)));
      this.disposables.add(atom.commands.add("atom-workspace", "term3:pipe-path", this.pipeTerm.bind(this, 'path')));
      this.disposables.add(atom.commands.add("atom-workspace", "term3:pipe-selection", this.pipeTerm.bind(this, 'selection')));
      return atom.packages.activatePackage('tree-view').then((function(_this) {
        return function(treeViewPkg) {
          var node;
          node = new ListView();
          return treeViewPkg.mainModule.treeView.find(".tree-view-scroller").prepend(node);
        };
      })(this));
    },
    service_0_1_3: function() {
      return {
        getTerminals: this.getTerminals.bind(this),
        onTerm: this.onTerm.bind(this),
        newTerm: this.newTerm.bind(this)
      };
    },
    getTerminals: function() {
      return Terminals.map(function(t) {
        return t.term;
      });
    },
    onTerm: function(callback) {
      return this.emitter.on('term', callback);
    },
    newTerm: function(forkPTY, rows, cols, title) {
      var id, item, model, pane, subscriptions, termView;
      if (forkPTY == null) {
        forkPTY = true;
      }
      if (rows == null) {
        rows = 30;
      }
      if (cols == null) {
        cols = 80;
      }
      if (title == null) {
        title = 'tty';
      }
      termView = this.createTermView(forkPTY, rows, cols);
      pane = atom.workspace.getActivePane();
      model = Terminals.add({
        local: !!forkPTY,
        term: termView,
        title: title
      });
      subscriptions = new CompositeDisposable;
      subscriptions.add(pane.onDidChangeActiveItem(function() {
        var activeItem;
        activeItem = pane.getActiveItem();
        if (activeItem !== termView) {
          if (termView.term) {
            termView.term.constructor._textarea = null;
          }
          return;
        }
        return process.nextTick(function() {
          var atomPane;
          termView.focus();
          atomPane = activeItem.parentsUntil("atom-pane").parent()[0];
          if (termView.term) {
            return termView.term.constructor._textarea = atomPane;
          }
        });
      }));
      id = model.id;
      termView.id = id;
      subscriptions.add(termView.onExit(function() {
        return Terminals.remove(id);
      }));
      subscriptions.add(termView.onDidChangeTitle(function() {
        if (forkPTY) {
          return model.title = termView.getTitle();
        } else {
          return model.title = title + '-' + termView.getTitle();
        }
      }));
      item = pane.addItem(termView);
      pane.activateItem(item);
      subscriptions.add(pane.onWillRemoveItem((function(_this) {
        return function(itemRemoved, index) {
          if (itemRemoved.item === item) {
            item.destroy();
            Terminals.remove(id);
            _this.disposables.remove(subscriptions);
            return subscriptions.dispose();
          }
        };
      })(this)));
      this.disposables.add(subscriptions);
      return termView;
    },
    createTermView: function(forkPTY, rows, cols) {
      var editorPath, opts, termView, _base;
      if (forkPTY == null) {
        forkPTY = true;
      }
      if (rows == null) {
        rows = 30;
      }
      if (cols == null) {
        cols = 80;
      }
      opts = {
        runCommand: atom.config.get('term3.autoRunCommand'),
        shellOverride: atom.config.get('term3.shellOverride'),
        shellArguments: atom.config.get('term3.shellArguments'),
        titleTemplate: atom.config.get('term3.titleTemplate'),
        cursorBlink: atom.config.get('term3.cursorBlink'),
        fontFamily: atom.config.get('term3.fontFamily'),
        fontSize: atom.config.get('term3.fontSize'),
        colors: getColors(),
        forkPTY: forkPTY,
        rows: rows,
        cols: cols
      };
      if (opts.shellOverride) {
        opts.shell = opts.shellOverride;
      } else {
        opts.shell = process.env.SHELL || 'bash';
      }
      editorPath = keypather.get(atom, 'workspace.getEditorViews[0].getEditor().getPath()');
      opts.cwd = opts.cwd || atom.project.getPaths()[0] || editorPath || process.env.HOME;
      termView = new TermView(opts);
      termView.on('remove', this.handleRemoveTerm.bind(this));
      if (typeof (_base = this.termViews).push === "function") {
        _base.push(termView);
      }
      process.nextTick((function(_this) {
        return function() {
          return _this.emitter.emit('term', termView);
        };
      })(this));
      return termView;
    },
    splitTerm: function(direction) {
      var activePane, item, openPanesInSameSplit, pane, splitter, termView;
      openPanesInSameSplit = atom.config.get('term3.openPanesInSameSplit');
      termView = this.createTermView();
      termView.on("click", (function(_this) {
        return function() {
          termView.term.element.focus();
          termView.term.focus();
          return _this.focusedTerminal = termView;
        };
      })(this));
      direction = capitalize(direction);
      splitter = (function(_this) {
        return function() {
          var pane;
          pane = activePane["split" + direction]({
            items: [termView]
          });
          activePane.termSplits[direction] = pane;
          return _this.focusedTerminal = [pane, pane.items[0]];
        };
      })(this);
      activePane = atom.workspace.getActivePane();
      activePane.termSplits || (activePane.termSplits = {});
      if (openPanesInSameSplit) {
        if (activePane.termSplits[direction] && activePane.termSplits[direction].items.length > 0) {
          pane = activePane.termSplits[direction];
          item = pane.addItem(termView);
          pane.activateItem(item);
          return this.focusedTerminal = [pane, item];
        } else {
          return splitter();
        }
      } else {
        return splitter();
      }
    },
    pipeTerm: function(action) {
      var editor, item, pane, stream, _ref;
      editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }
      stream = (function() {
        switch (action) {
          case 'path':
            return editor.getBuffer().file.path;
          case 'selection':
            return editor.getSelectedText();
        }
      })();
      if (stream && this.focusedTerminal) {
        if (Array.isArray(this.focusedTerminal)) {
          _ref = this.focusedTerminal, pane = _ref[0], item = _ref[1];
          pane.activateItem(item);
        } else {
          item = this.focusedTerminal;
        }
        item.pty.write(stream.trim());
        return item.term.focus();
      }
    },
    handleRemoveTerm: function(termView) {
      return this.termViews.splice(this.termViews.indexOf(termView), 1);
    },
    deactivate: function() {
      this.termViews.forEach(function(view) {
        return view.exit();
      });
      this.termViews = [];
      return this.disposables.dispose;
    },
    serialize: function() {
      var termViewsState;
      termViewsState = this.termViews.map(function(view) {
        return view.serialize();
      });
      return {
        termViews: termViewsState
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAiZmlsZSI6ICIiLAogICJzb3VyY2VSb290IjogIiIsCiAgInNvdXJjZXMiOiBbCiAgICAiL1VzZXJzL25vcmkuay8uYXRvbS9wYWNrYWdlcy90ZXJtMy9pbmRleC5jb2ZmZWUiCiAgXSwKICAibmFtZXMiOiBbXSwKICAibWFwcGluZ3MiOiAiQUFBQTtBQUFBLE1BQUEsMkdBQUE7O0FBQUEsRUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVIsQ0FBUCxDQUFBOztBQUFBLEVBQ0EsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUixDQURYLENBQUE7O0FBQUEsRUFFQSxRQUFBLEdBQVcsT0FBQSxDQUFRLHVCQUFSLENBRlgsQ0FBQTs7QUFBQSxFQUdBLFNBQUEsR0FBWSxPQUFBLENBQVEsc0JBQVIsQ0FIWixDQUFBOztBQUFBLEVBSUMsVUFBWSxPQUFBLENBQVEsV0FBUixFQUFaLE9BSkQsQ0FBQTs7QUFBQSxFQUtBLFNBQUEsR0FBZ0IsT0FBQSxDQUFRLFdBQVIsQ0FBSCxDQUFBLENBTGIsQ0FBQTs7QUFBQSxFQU1DLHNCQUF1QixPQUFBLENBQVEsV0FBUixFQUF2QixtQkFORCxDQUFBOztBQUFBLEVBUUEsVUFBQSxHQUFhLFNBQUMsR0FBRCxHQUFBO1dBQVEsR0FBSSxDQUFBLENBQUEsQ0FBRSxDQUFDLFdBQVAsQ0FBQSxDQUFBLEdBQXVCLEdBQUksU0FBSSxDQUFDLFdBQVQsQ0FBQSxFQUEvQjtFQUFBLENBUmIsQ0FBQTs7QUFBQSxFQVVBLFNBQUEsR0FBWSxTQUFBLEdBQUE7QUFDVixRQUFBLHdPQUFBO0FBQUEsSUFBQSxPQU1JLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFaLENBQW1CLGNBQW5CLENBQUQsQ0FBb0MsQ0FBQSxDQUFBLENBQUUsQ0FBQyxLQU4zQyxFQUNFLG1CQUFBLFdBREYsRUFDZSxpQkFBQSxTQURmLEVBQzBCLG1CQUFBLFdBRDFCLEVBQ3VDLG9CQUFBLFlBRHZDLEVBRUUsa0JBQUEsVUFGRixFQUVjLG9CQUFBLFlBRmQsRUFFNEIsa0JBQUEsVUFGNUIsRUFFd0MsbUJBQUEsV0FGeEMsRUFHRSxtQkFBQSxXQUhGLEVBR2UsaUJBQUEsU0FIZixFQUcwQixtQkFBQSxXQUgxQixFQUd1QyxvQkFBQSxZQUh2QyxFQUlFLGtCQUFBLFVBSkYsRUFJYyxvQkFBQSxZQUpkLEVBSTRCLGtCQUFBLFVBSjVCLEVBSXdDLG1CQUFBLFdBSnhDLEVBS0Usa0JBQUEsVUFMRixFQUtjLGtCQUFBLFVBTGQsQ0FBQTtXQU9BLENBQ0UsV0FERixFQUNlLFNBRGYsRUFDMEIsV0FEMUIsRUFDdUMsWUFEdkMsRUFFRSxVQUZGLEVBRWMsWUFGZCxFQUU0QixVQUY1QixFQUV3QyxXQUZ4QyxFQUdFLFdBSEYsRUFHZSxTQUhmLEVBRzBCLFdBSDFCLEVBR3VDLFlBSHZDLEVBSUUsVUFKRixFQUljLFlBSmQsRUFJNEIsVUFKNUIsRUFJd0MsV0FKeEMsRUFLRSxVQUxGLEVBS2MsVUFMZCxDQU1DLENBQUMsR0FORixDQU1NLFNBQUMsS0FBRCxHQUFBO2FBQVcsS0FBSyxDQUFDLFdBQU4sQ0FBQSxFQUFYO0lBQUEsQ0FOTixFQVJVO0VBQUEsQ0FWWixDQUFBOztBQUFBLEVBMEJBLE1BQUEsR0FDRTtBQUFBLElBQUEsY0FBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLE1BQ0EsU0FBQSxFQUFTLEVBRFQ7S0FERjtBQUFBLElBR0EsYUFBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLE1BQ0EsU0FBQSxFQUFTLDJCQURUO0tBSkY7QUFBQSxJQU1BLFVBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFFBQU47QUFBQSxNQUNBLFNBQUEsRUFBUyxFQURUO0tBUEY7QUFBQSxJQVNBLFFBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFFBQU47QUFBQSxNQUNBLFNBQUEsRUFBUyxFQURUO0tBVkY7QUFBQSxJQVlBLE1BQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFFBQU47QUFBQSxNQUNBLFVBQUEsRUFDRTtBQUFBLFFBQUEsV0FBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FERjtBQUFBLFFBR0EsU0FBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FKRjtBQUFBLFFBTUEsV0FBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FQRjtBQUFBLFFBU0EsWUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FWRjtBQUFBLFFBWUEsVUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FiRjtBQUFBLFFBZUEsWUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FoQkY7QUFBQSxRQWtCQSxVQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxPQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsU0FEVDtTQW5CRjtBQUFBLFFBcUJBLFdBQUEsRUFDRTtBQUFBLFVBQUEsSUFBQSxFQUFNLE9BQU47QUFBQSxVQUNBLFNBQUEsRUFBUyxTQURUO1NBdEJGO0FBQUEsUUF3QkEsV0FBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0F6QkY7QUFBQSxRQTJCQSxTQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxPQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsU0FEVDtTQTVCRjtBQUFBLFFBOEJBLFdBQUEsRUFDRTtBQUFBLFVBQUEsSUFBQSxFQUFNLE9BQU47QUFBQSxVQUNBLFNBQUEsRUFBUyxTQURUO1NBL0JGO0FBQUEsUUFpQ0EsWUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FsQ0Y7QUFBQSxRQW9DQSxVQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxPQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsU0FEVDtTQXJDRjtBQUFBLFFBdUNBLFlBQUEsRUFDRTtBQUFBLFVBQUEsSUFBQSxFQUFNLE9BQU47QUFBQSxVQUNBLFNBQUEsRUFBUyxTQURUO1NBeENGO0FBQUEsUUEwQ0EsVUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0EzQ0Y7QUFBQSxRQTZDQSxXQUFBLEVBQ0U7QUFBQSxVQUFBLElBQUEsRUFBTSxPQUFOO0FBQUEsVUFDQSxTQUFBLEVBQVMsU0FEVDtTQTlDRjtBQUFBLFFBZ0RBLFVBQUEsRUFDRTtBQUFBLFVBQUEsSUFBQSxFQUFNLE9BQU47QUFBQSxVQUNBLFNBQUEsRUFBUyxTQURUO1NBakRGO0FBQUEsUUFtREEsVUFBQSxFQUNFO0FBQUEsVUFBQSxJQUFBLEVBQU0sT0FBTjtBQUFBLFVBQ0EsU0FBQSxFQUFTLFNBRFQ7U0FwREY7T0FGRjtLQWJGO0FBQUEsSUFxRUEsVUFBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sU0FBTjtBQUFBLE1BQ0EsU0FBQSxFQUFTLElBRFQ7S0F0RUY7QUFBQSxJQXdFQSxXQUFBLEVBQ0U7QUFBQSxNQUFBLElBQUEsRUFBTSxTQUFOO0FBQUEsTUFDQSxTQUFBLEVBQVMsSUFEVDtLQXpFRjtBQUFBLElBMkVBLGFBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFFBQU47QUFBQSxNQUNBLFNBQUEsRUFBUyxFQURUO0tBNUVGO0FBQUEsSUE4RUEsY0FBQSxFQUNFO0FBQUEsTUFBQSxJQUFBLEVBQU0sUUFBTjtBQUFBLE1BQ0EsU0FBQSxFQUFZLENBQUEsU0FBQyxJQUFELEdBQUE7QUFDVixZQUFBLFdBQUE7QUFBQSxRQURZLGFBQUEsT0FBTyxZQUFBLElBQ25CLENBQUE7QUFBQSxnQkFBTyxJQUFJLENBQUMsUUFBTCxDQUFjLEtBQUEsSUFBUyxLQUFLLENBQUMsV0FBTixDQUFBLENBQXZCLENBQVA7QUFBQSxlQUNPLE1BRFA7bUJBQ29CLGNBQUEsR0FBYSxDQUFDLElBQUksQ0FBQyxJQUFMLENBQVUsSUFBVixFQUFnQixlQUFoQixDQUFELEVBRGpDO0FBQUEsZUFFTyxLQUZQO21CQUVtQixLQUZuQjtBQUFBO21CQUdPLEdBSFA7QUFBQSxTQURVO01BQUEsQ0FBQSxDQUFILENBQWtCLE9BQU8sQ0FBQyxHQUExQixDQURUO0tBL0VGO0FBQUEsSUFxRkEsb0JBQUEsRUFDRTtBQUFBLE1BQUEsSUFBQSxFQUFNLFNBQU47QUFBQSxNQUNBLFNBQUEsRUFBUyxLQURUO0tBdEZGO0dBM0JGLENBQUE7O0FBQUEsRUFvSEEsTUFBTSxDQUFDLE9BQVAsR0FFRTtBQUFBLElBQUEsU0FBQSxFQUFXLEVBQVg7QUFBQSxJQUNBLGVBQUEsRUFBaUIsS0FEakI7QUFBQSxJQUVBLE9BQUEsRUFBYSxJQUFBLE9BQUEsQ0FBQSxDQUZiO0FBQUEsSUFHQSxNQUFBLEVBQVEsTUFIUjtBQUFBLElBSUEsV0FBQSxFQUFhLElBSmI7QUFBQSxJQU1BLFFBQUEsRUFBVSxTQUFFLEtBQUYsR0FBQTtBQUNSLE1BRFMsSUFBQyxDQUFBLFFBQUEsS0FDVixDQUFBO0FBQUEsTUFBQSxJQUFDLENBQUEsV0FBRCxHQUFtQixJQUFBLG1CQUFBLENBQUEsQ0FBbkIsQ0FBQTtBQUVBLE1BQUEsSUFBQSxDQUFBLE9BQWMsQ0FBQyxHQUFHLENBQUMsSUFBbkI7QUFDRSxRQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsc0tBQWIsQ0FBQSxDQURGO09BRkE7QUFBQSxNQUtBLENBQUMsSUFBRCxFQUFPLE9BQVAsRUFBZ0IsTUFBaEIsRUFBd0IsTUFBeEIsQ0FBK0IsQ0FBQyxPQUFoQyxDQUF3QyxDQUFBLFNBQUEsS0FBQSxHQUFBO2VBQUEsU0FBQyxTQUFELEdBQUE7aUJBQ3RDLEtBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQXFDLG1CQUFBLEdBQW1CLFNBQXhELEVBQXFFLEtBQUMsQ0FBQSxTQUFTLENBQUMsSUFBWCxDQUFnQixLQUFoQixFQUFzQixTQUF0QixDQUFyRSxDQUFqQixFQURzQztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXhDLENBTEEsQ0FBQTtBQUFBLE1BUUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0MsWUFBcEMsRUFBa0QsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUFsRCxDQUFqQixDQVJBLENBQUE7QUFBQSxNQVNBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGlCQUFwQyxFQUF1RCxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxJQUFmLEVBQXFCLE1BQXJCLENBQXZELENBQWpCLENBVEEsQ0FBQTtBQUFBLE1BVUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0Msc0JBQXBDLEVBQTRELElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLElBQWYsRUFBcUIsV0FBckIsQ0FBNUQsQ0FBakIsQ0FWQSxDQUFBO2FBWUEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLFdBQTlCLENBQTBDLENBQUMsSUFBM0MsQ0FBZ0QsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUMsV0FBRCxHQUFBO0FBQzlDLGNBQUEsSUFBQTtBQUFBLFVBQUEsSUFBQSxHQUFXLElBQUEsUUFBQSxDQUFBLENBQVgsQ0FBQTtpQkFDQSxXQUFXLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFoQyxDQUFxQyxxQkFBckMsQ0FBMkQsQ0FBQyxPQUE1RCxDQUFvRSxJQUFwRSxFQUY4QztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhELEVBYlE7SUFBQSxDQU5WO0FBQUEsSUF1QkEsYUFBQSxFQUFlLFNBQUEsR0FBQTthQUNiO0FBQUEsUUFDRSxZQUFBLEVBQWMsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQW1CLElBQW5CLENBRGhCO0FBQUEsUUFFRSxNQUFBLEVBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLENBQWEsSUFBYixDQUZWO0FBQUEsUUFHRSxPQUFBLEVBQVMsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUhYO1FBRGE7SUFBQSxDQXZCZjtBQUFBLElBOEJBLFlBQUEsRUFBYyxTQUFBLEdBQUE7YUFDWixTQUFTLENBQUMsR0FBVixDQUFjLFNBQUMsQ0FBRCxHQUFBO2VBQ1osQ0FBQyxDQUFDLEtBRFU7TUFBQSxDQUFkLEVBRFk7SUFBQSxDQTlCZDtBQUFBLElBa0NBLE1BQUEsRUFBUSxTQUFDLFFBQUQsR0FBQTthQUNOLElBQUMsQ0FBQSxPQUFPLENBQUMsRUFBVCxDQUFZLE1BQVosRUFBb0IsUUFBcEIsRUFETTtJQUFBLENBbENSO0FBQUEsSUFxQ0EsT0FBQSxFQUFTLFNBQUMsT0FBRCxFQUFlLElBQWYsRUFBd0IsSUFBeEIsRUFBaUMsS0FBakMsR0FBQTtBQUNQLFVBQUEsOENBQUE7O1FBRFEsVUFBUTtPQUNoQjs7UUFEc0IsT0FBSztPQUMzQjs7UUFEK0IsT0FBSztPQUNwQzs7UUFEd0MsUUFBTTtPQUM5QztBQUFBLE1BQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxjQUFELENBQWdCLE9BQWhCLEVBQXlCLElBQXpCLEVBQStCLElBQS9CLENBQVgsQ0FBQTtBQUFBLE1BQ0EsSUFBQSxHQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBZixDQUFBLENBRFAsQ0FBQTtBQUFBLE1BRUEsS0FBQSxHQUFRLFNBQVMsQ0FBQyxHQUFWLENBQWM7QUFBQSxRQUNwQixLQUFBLEVBQU8sQ0FBQSxDQUFDLE9BRFk7QUFBQSxRQUVwQixJQUFBLEVBQU0sUUFGYztBQUFBLFFBR3BCLEtBQUEsRUFBTyxLQUhhO09BQWQsQ0FGUixDQUFBO0FBQUEsTUFTQSxhQUFBLEdBQWdCLEdBQUEsQ0FBQSxtQkFUaEIsQ0FBQTtBQUFBLE1BV0EsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLHFCQUFMLENBQTJCLFNBQUEsR0FBQTtBQUMzQyxZQUFBLFVBQUE7QUFBQSxRQUFBLFVBQUEsR0FBYSxJQUFJLENBQUMsYUFBTCxDQUFBLENBQWIsQ0FBQTtBQUNBLFFBQUEsSUFBRyxVQUFBLEtBQWMsUUFBakI7QUFDRSxVQUFBLElBQUcsUUFBUSxDQUFDLElBQVo7QUFDRSxZQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQTFCLEdBQXNDLElBQXRDLENBREY7V0FBQTtBQUVBLGdCQUFBLENBSEY7U0FEQTtlQU1BLE9BQU8sQ0FBQyxRQUFSLENBQWlCLFNBQUEsR0FBQTtBQUNmLGNBQUEsUUFBQTtBQUFBLFVBQUEsUUFBUSxDQUFDLEtBQVQsQ0FBQSxDQUFBLENBQUE7QUFBQSxVQUtBLFFBQUEsR0FBVyxVQUFVLENBQUMsWUFBWCxDQUF3QixXQUF4QixDQUFvQyxDQUFDLE1BQXJDLENBQUEsQ0FBOEMsQ0FBQSxDQUFBLENBTHpELENBQUE7QUFNQSxVQUFBLElBQUcsUUFBUSxDQUFDLElBQVo7bUJBQ0UsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBMUIsR0FBc0MsU0FEeEM7V0FQZTtRQUFBLENBQWpCLEVBUDJDO01BQUEsQ0FBM0IsQ0FBbEIsQ0FYQSxDQUFBO0FBQUEsTUE0QkEsRUFBQSxHQUFLLEtBQUssQ0FBQyxFQTVCWCxDQUFBO0FBQUEsTUE2QkEsUUFBUSxDQUFDLEVBQVQsR0FBYyxFQTdCZCxDQUFBO0FBQUEsTUErQkEsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsUUFBUSxDQUFDLE1BQVQsQ0FBZ0IsU0FBQSxHQUFBO2VBQ2hDLFNBQVMsQ0FBQyxNQUFWLENBQWlCLEVBQWpCLEVBRGdDO01BQUEsQ0FBaEIsQ0FBbEIsQ0EvQkEsQ0FBQTtBQUFBLE1Ba0NBLGFBQWEsQ0FBQyxHQUFkLENBQWtCLFFBQVEsQ0FBQyxnQkFBVCxDQUEwQixTQUFBLEdBQUE7QUFDMUMsUUFBQSxJQUFHLE9BQUg7aUJBQ0UsS0FBSyxDQUFDLEtBQU4sR0FBYyxRQUFRLENBQUMsUUFBVCxDQUFBLEVBRGhCO1NBQUEsTUFBQTtpQkFHRSxLQUFLLENBQUMsS0FBTixHQUFjLEtBQUEsR0FBUSxHQUFSLEdBQWMsUUFBUSxDQUFDLFFBQVQsQ0FBQSxFQUg5QjtTQUQwQztNQUFBLENBQTFCLENBQWxCLENBbENBLENBQUE7QUFBQSxNQXdDQSxJQUFBLEdBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxRQUFiLENBeENQLENBQUE7QUFBQSxNQXlDQSxJQUFJLENBQUMsWUFBTCxDQUFrQixJQUFsQixDQXpDQSxDQUFBO0FBQUEsTUEwQ0EsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBSSxDQUFDLGdCQUFMLENBQXNCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFDLFdBQUQsRUFBYyxLQUFkLEdBQUE7QUFDdEMsVUFBQSxJQUFHLFdBQVcsQ0FBQyxJQUFaLEtBQW9CLElBQXZCO0FBQ0UsWUFBQSxJQUFJLENBQUMsT0FBTCxDQUFBLENBQUEsQ0FBQTtBQUFBLFlBQ0EsU0FBUyxDQUFDLE1BQVYsQ0FBaUIsRUFBakIsQ0FEQSxDQUFBO0FBQUEsWUFFQSxLQUFDLENBQUEsV0FBVyxDQUFDLE1BQWIsQ0FBb0IsYUFBcEIsQ0FGQSxDQUFBO21CQUdBLGFBQWEsQ0FBQyxPQUFkLENBQUEsRUFKRjtXQURzQztRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRCLENBQWxCLENBMUNBLENBQUE7QUFBQSxNQWdEQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsYUFBakIsQ0FoREEsQ0FBQTthQWlEQSxTQWxETztJQUFBLENBckNUO0FBQUEsSUF5RkEsY0FBQSxFQUFnQixTQUFDLE9BQUQsRUFBZSxJQUFmLEVBQXdCLElBQXhCLEdBQUE7QUFDZCxVQUFBLGlDQUFBOztRQURlLFVBQVE7T0FDdkI7O1FBRDZCLE9BQUs7T0FDbEM7O1FBRHNDLE9BQUs7T0FDM0M7QUFBQSxNQUFBLElBQUEsR0FDRTtBQUFBLFFBQUEsVUFBQSxFQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0JBQWhCLENBQWhCO0FBQUEsUUFDQSxhQUFBLEVBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixxQkFBaEIsQ0FEaEI7QUFBQSxRQUVBLGNBQUEsRUFBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNCQUFoQixDQUZoQjtBQUFBLFFBR0EsYUFBQSxFQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IscUJBQWhCLENBSGhCO0FBQUEsUUFJQSxXQUFBLEVBQWdCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQixtQkFBaEIsQ0FKaEI7QUFBQSxRQUtBLFVBQUEsRUFBZ0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLGtCQUFoQixDQUxoQjtBQUFBLFFBTUEsUUFBQSxFQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsZ0JBQWhCLENBTmhCO0FBQUEsUUFPQSxNQUFBLEVBQWdCLFNBQUEsQ0FBQSxDQVBoQjtBQUFBLFFBUUEsT0FBQSxFQUFnQixPQVJoQjtBQUFBLFFBU0EsSUFBQSxFQUFnQixJQVRoQjtBQUFBLFFBVUEsSUFBQSxFQUFnQixJQVZoQjtPQURGLENBQUE7QUFhQSxNQUFBLElBQUcsSUFBSSxDQUFDLGFBQVI7QUFDSSxRQUFBLElBQUksQ0FBQyxLQUFMLEdBQWEsSUFBSSxDQUFDLGFBQWxCLENBREo7T0FBQSxNQUFBO0FBR0ksUUFBQSxJQUFJLENBQUMsS0FBTCxHQUFhLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBWixJQUFxQixNQUFsQyxDQUhKO09BYkE7QUFBQSxNQW1CQSxVQUFBLEdBQWEsU0FBUyxDQUFDLEdBQVYsQ0FBYyxJQUFkLEVBQW9CLG1EQUFwQixDQW5CYixDQUFBO0FBQUEsTUFvQkEsSUFBSSxDQUFDLEdBQUwsR0FBVyxJQUFJLENBQUMsR0FBTCxJQUFZLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBYixDQUFBLENBQXdCLENBQUEsQ0FBQSxDQUFwQyxJQUEwQyxVQUExQyxJQUF3RCxPQUFPLENBQUMsR0FBRyxDQUFDLElBcEIvRSxDQUFBO0FBQUEsTUFzQkEsUUFBQSxHQUFlLElBQUEsUUFBQSxDQUFTLElBQVQsQ0F0QmYsQ0FBQTtBQUFBLE1BdUJBLFFBQVEsQ0FBQyxFQUFULENBQVksUUFBWixFQUFzQixJQUFDLENBQUEsZ0JBQWdCLENBQUMsSUFBbEIsQ0FBdUIsSUFBdkIsQ0FBdEIsQ0F2QkEsQ0FBQTs7YUF5QlUsQ0FBQyxLQUFNO09BekJqQjtBQUFBLE1BMEJBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFBLEdBQUE7aUJBQU0sS0FBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsTUFBZCxFQUFzQixRQUF0QixFQUFOO1FBQUEsRUFBQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBakIsQ0ExQkEsQ0FBQTthQTJCQSxTQTVCYztJQUFBLENBekZoQjtBQUFBLElBdUhBLFNBQUEsRUFBVyxTQUFDLFNBQUQsR0FBQTtBQUNULFVBQUEsZ0VBQUE7QUFBQSxNQUFBLG9CQUFBLEdBQXVCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiw0QkFBaEIsQ0FBdkIsQ0FBQTtBQUFBLE1BQ0EsUUFBQSxHQUFXLElBQUMsQ0FBQSxjQUFELENBQUEsQ0FEWCxDQUFBO0FBQUEsTUFFQSxRQUFRLENBQUMsRUFBVCxDQUFZLE9BQVosRUFBcUIsQ0FBQSxTQUFBLEtBQUEsR0FBQTtlQUFBLFNBQUEsR0FBQTtBQUluQixVQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQXRCLENBQUEsQ0FBQSxDQUFBO0FBQUEsVUFDQSxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQWQsQ0FBQSxDQURBLENBQUE7aUJBR0EsS0FBQyxDQUFBLGVBQUQsR0FBbUIsU0FQQTtRQUFBLEVBQUE7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCLENBRkEsQ0FBQTtBQUFBLE1BVUEsU0FBQSxHQUFZLFVBQUEsQ0FBVyxTQUFYLENBVlosQ0FBQTtBQUFBLE1BWUEsUUFBQSxHQUFXLENBQUEsU0FBQSxLQUFBLEdBQUE7ZUFBQSxTQUFBLEdBQUE7QUFDVCxjQUFBLElBQUE7QUFBQSxVQUFBLElBQUEsR0FBTyxVQUFXLENBQUMsT0FBQSxHQUFPLFNBQVIsQ0FBWCxDQUFnQztBQUFBLFlBQUEsS0FBQSxFQUFPLENBQUMsUUFBRCxDQUFQO1dBQWhDLENBQVAsQ0FBQTtBQUFBLFVBQ0EsVUFBVSxDQUFDLFVBQVcsQ0FBQSxTQUFBLENBQXRCLEdBQW1DLElBRG5DLENBQUE7aUJBRUEsS0FBQyxDQUFBLGVBQUQsR0FBbUIsQ0FBQyxJQUFELEVBQU8sSUFBSSxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQWxCLEVBSFY7UUFBQSxFQUFBO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVpYLENBQUE7QUFBQSxNQWlCQSxVQUFBLEdBQWEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFmLENBQUEsQ0FqQmIsQ0FBQTtBQUFBLE1Ba0JBLFVBQVUsQ0FBQyxlQUFYLFVBQVUsQ0FBQyxhQUFlLEdBbEIxQixDQUFBO0FBbUJBLE1BQUEsSUFBRyxvQkFBSDtBQUNFLFFBQUEsSUFBRyxVQUFVLENBQUMsVUFBVyxDQUFBLFNBQUEsQ0FBdEIsSUFBcUMsVUFBVSxDQUFDLFVBQVcsQ0FBQSxTQUFBLENBQVUsQ0FBQyxLQUFLLENBQUMsTUFBdkMsR0FBZ0QsQ0FBeEY7QUFDRSxVQUFBLElBQUEsR0FBTyxVQUFVLENBQUMsVUFBVyxDQUFBLFNBQUEsQ0FBN0IsQ0FBQTtBQUFBLFVBQ0EsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsUUFBYixDQURQLENBQUE7QUFBQSxVQUVBLElBQUksQ0FBQyxZQUFMLENBQWtCLElBQWxCLENBRkEsQ0FBQTtpQkFHQSxJQUFDLENBQUEsZUFBRCxHQUFtQixDQUFDLElBQUQsRUFBTyxJQUFQLEVBSnJCO1NBQUEsTUFBQTtpQkFNRSxRQUFBLENBQUEsRUFORjtTQURGO09BQUEsTUFBQTtlQVNFLFFBQUEsQ0FBQSxFQVRGO09BcEJTO0lBQUEsQ0F2SFg7QUFBQSxJQXNKQSxRQUFBLEVBQVUsU0FBQyxNQUFELEdBQUE7QUFDUixVQUFBLGdDQUFBO0FBQUEsTUFBQSxNQUFBLEdBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxtQkFBZixDQUFBLENBQVQsQ0FBQTtBQUNBLE1BQUEsSUFBRyxDQUFBLE1BQUg7QUFDRSxjQUFBLENBREY7T0FEQTtBQUFBLE1BR0EsTUFBQTtBQUFTLGdCQUFPLE1BQVA7QUFBQSxlQUNGLE1BREU7bUJBRUwsTUFBTSxDQUFDLFNBQVAsQ0FBQSxDQUFrQixDQUFDLElBQUksQ0FBQyxLQUZuQjtBQUFBLGVBR0YsV0FIRTttQkFJTCxNQUFNLENBQUMsZUFBUCxDQUFBLEVBSks7QUFBQTtVQUhULENBQUE7QUFTQSxNQUFBLElBQUcsTUFBQSxJQUFXLElBQUMsQ0FBQSxlQUFmO0FBQ0UsUUFBQSxJQUFHLEtBQUssQ0FBQyxPQUFOLENBQWMsSUFBQyxDQUFBLGVBQWYsQ0FBSDtBQUNFLFVBQUEsT0FBZSxJQUFDLENBQUEsZUFBaEIsRUFBQyxjQUFELEVBQU8sY0FBUCxDQUFBO0FBQUEsVUFDQSxJQUFJLENBQUMsWUFBTCxDQUFrQixJQUFsQixDQURBLENBREY7U0FBQSxNQUFBO0FBSUUsVUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLGVBQVIsQ0FKRjtTQUFBO0FBQUEsUUFNQSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQVQsQ0FBZSxNQUFNLENBQUMsSUFBUCxDQUFBLENBQWYsQ0FOQSxDQUFBO2VBT0EsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFWLENBQUEsRUFSRjtPQVZRO0lBQUEsQ0F0SlY7QUFBQSxJQTBLQSxnQkFBQSxFQUFrQixTQUFDLFFBQUQsR0FBQTthQUNoQixJQUFDLENBQUEsU0FBUyxDQUFDLE1BQVgsQ0FBa0IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFYLENBQW1CLFFBQW5CLENBQWxCLEVBQWdELENBQWhELEVBRGdCO0lBQUEsQ0ExS2xCO0FBQUEsSUE2S0EsVUFBQSxFQUFXLFNBQUEsR0FBQTtBQUNULE1BQUEsSUFBQyxDQUFBLFNBQVMsQ0FBQyxPQUFYLENBQW1CLFNBQUMsSUFBRCxHQUFBO2VBQVUsSUFBSSxDQUFDLElBQUwsQ0FBQSxFQUFWO01BQUEsQ0FBbkIsQ0FBQSxDQUFBO0FBQUEsTUFDQSxJQUFDLENBQUEsU0FBRCxHQUFhLEVBRGIsQ0FBQTthQUVBLElBQUMsQ0FBQSxXQUFXLENBQUMsUUFISjtJQUFBLENBN0tYO0FBQUEsSUFrTEEsU0FBQSxFQUFVLFNBQUEsR0FBQTtBQUNSLFVBQUEsY0FBQTtBQUFBLE1BQUEsY0FBQSxHQUFpQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsU0FBQyxJQUFELEdBQUE7ZUFBUyxJQUFJLENBQUMsU0FBTCxDQUFBLEVBQVQ7TUFBQSxDQUFuQixDQUFqQixDQUFBO2FBQ0E7QUFBQSxRQUFDLFNBQUEsRUFBVyxjQUFaO1FBRlE7SUFBQSxDQWxMVjtHQXRIRixDQUFBO0FBQUEiCn0=

//# sourceURL=/Users/nori.k/.atom/packages/term3/index.coffee
