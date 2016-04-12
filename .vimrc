"#####表示設定#####
set nocompatible
if has("syntax")
	syntax on
endif

set wildmenu 				"補完機能を使う
set display=lastline		"複数行に折り返すとき間の行に@を表示しない
set mouse=a					"マウスを使う
set number 					"行番号を表示する
set title 					"編集中のファイル名を表示
set showmatch 				"括弧入力時の対応する括弧を表示
set tabstop=4 				"インデントをスペース4つ分に設定
set smartindent 			"オートインデント
set autoindent				"自動インデントを有効に
set list					"不可視文字の表示
set listchars=tab:»-,trail:-,eol:↲,extends:»,precedes:«,nbsp:%
							"不可視文字の表示指定
set ambiwidth=double		"全角文字を幅固定
set clipboard=unnamed,unnamedplus
							"クリップボードをOSと共有
set whichwrap=b,s,h,l,[,],<,>,~
							"左右のカーソル移動で行をまたいで移動
set backspace=indent,eol,start
set laststatus=2			"ステータス表示を2行にする
set ignorecase 				"大文字/小文字の区別なく検索する
set smartcase 				"検索文字列に大文字が含まれている場合は区別して検索する
set wrapscan 				"検索時に最後まで行ったら最初に戻る
set expandtab				"
set shiftwidth=4
set hlsearch				"検索文字列のハイライト
set pumheight=10			"補完の数を10個にする

