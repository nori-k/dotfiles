if &compatible
  set nocompatible
endif

if has("syntax")
	syntax on
endif
"syntax theme
"molokai
let g:molokai_original = 1
let g:rehash256 = 1


set display=lastline                                        "複数行に折り返すとき間の行に@を表示しない
set mouse=a                                                 "マウスを使う
set number                                                  "行番号を表示する
set title                                                   "編集中のファイル名を表示
set showmatch                                               "括弧入力時の対応する括弧を表示
set ts=4 sw=4 et                                            "インデントをスペース4つ分に設定
"set expandtab                                              "タブでスペースを使う
set smartindent                                             "オートインデント
set autoindent                                              "自動インデントを有効に
set list                                                    "不可視文字の表示
set listchars=tab:»-,trail:-,eol:↲,extends:»,precedes:«     "不可視文字の表示指定
set ambiwidth=double                                        "全角文字を幅固定
set clipboard=unnamed,unnamedplus                           "クリップボードをOSと共有
set whichwrap=b,s,h,l,[,],<,>,~                             "左右のカーソル移動で行をまたいで移動
set laststatus=2                                            "ステータス表示を2行にする
set ignorecase                                              "大文字/小文字の区別なく検索する
set smartcase                                               "検索文字列に大文字が含まれている場合は区別して検索する
set wrapscan                                                "検索時に最後まで行ったら最初に戻る
set hlsearch                                                "検索文字列のハイライト
set backspace=indent,eol,start
set statusline=%<%f\ %h%m%r%{fugitive#statusline()}%=%-14.(%l,%c%V%)\ %P
set background=dark
set noswapfile

"plugins
call plug#begin('~/.vim/plugged')
"plugins are below
Plug 'Shougo/unite.vim'                                     "環境
Plug 'Shougo/neocomplete.vim'                               "補完機能
Plug 'Shougo/neosnippet.vim'                                "スニペット機能
Plug 'Shougo/neosnippet-snippets'                           "スニペット辞書
Plug 'scrooloose/nerdtree'                                  "ツリー表示
Plug 'scrooloose/syntastic'                                 "文法、構文チェック
Plug 'tpope/vim-fugitive'                                   "git関係
Plug 't9md/vim-quickhl'                                     "ハイライト
"Plug 'vim-visualstar'                                       "Visualモードで選択した文字列を検索
Plug 'kien/ctrlp.vim'                                       "検索した結果をvimで開く
Plug 'osyo-manga/vim-watchdogs'                             "文法チェック
"Plug 'nathanaelkane/vim-indent-guides'                      "インデントガイド
Plug 'vim-scripts/AnsiEsc.vim'                              "ログの情報を色付け
Plug 'bronson/vim-trailing-whitespace'                      "行末の半角スペースを可視化
Plug 'itchyny/lightline.vim'                                "ステータスバー改造
Plug 'tomasr/molokai'
Plug 'mattn/emmet-vim'
Plug 'hokaccha/vim-html5validator'
Plug 'othree/html5.vim'
Plug 'hail2u/vim-css3-syntax'
Plug 'jelera/vim-javascript-syntax'

call plug#end()

""""""""""""""""""""""""""""""
"全角スペースの可視化
""""""""""""""""""""""""""""""
function! ZenkakuSpace()
    highlight ZenkakuSpace cterm=underline ctermfg=lightblue guibg=darkgray
    endfunction

if has('syntax')
    augroup ZenkakuSpace
        autocmd!
        autocmd ColorScheme * call ZenkakuSpace()
        autocmd VimEnter,WinEnter,BufRead * let w:m1=matchadd('ZenkakuSpace', '　')
    augroup END
    call ZenkakuSpace()
endif
""""""""""""""""""""""""""""""

"vim-indent-guides

"let g:indent_guides_enable_on_vim_startup=1
"let g:indent_guides_auto_colors=1
"autocmd VimEnter,Colorscheme * :hi IndentGuidesOdd   ctermbg=black
"autocmd VimEnter,Colorscheme * :hi IndentGuidesEven  ctermbg=darkgray
"let g:indent_guides_guide_size=2
"let g:indent_guides_color_change_percent=1

