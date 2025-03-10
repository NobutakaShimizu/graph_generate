# グラフジェネレーター

グラフ理論の学習やアルゴリズムの検証に使用できる、シンプルなグラフ作成ツールです。
ブラウザ上で動作し、作成したグラフを隣接行列または隣接リストとしてPythonの形式で出力できます。

## 機能

- グラフの種類
  - 無向グラフ
  - 有向グラフ

- 出力形式
  - 隣接行列
  - 隣接リスト

- 編集機能
  - 頂点の追加（ダブルクリック）
  - 頂点の削除（右クリック）
  - 辺の追加（頂点を順番にクリック）
  - 辺の削除（右クリック）
  - 頂点の移動（ドラッグ＆ドロップ）
  - 操作の取り消し（undoボタン）

## 使用方法

1. `index.html`をブラウザで開きます
2. グラフの種類（有向/無向）を選択します
3. グラフを編集します：
   - キャンバス上でダブルクリックして頂点を追加
   - 頂点を順番にクリックして辺を追加（有向グラフの場合、最初にクリックした頂点が始点）
   - 頂点や辺を右クリックして削除
   - 頂点をドラッグして移動
   - 必要に応じて「元に戻す」ボタンで直前の操作を取り消し
4. 出力形式（隣接行列/隣接リスト）を選択します
5. 表示された形式をPythonのコードとしてコピー＆ペーストして使用できます

## 出力例

### 隣接行列形式
```python
[
    [0, 1, 0],
    [1, 0, 1],
    [0, 1, 0]
]
```

### 隣接リスト形式
```python
[
    [1],
    [0, 2],
    [1]
]
```

## 技術仕様

- 純粋なHTML/CSS/JavaScriptで実装
- Canvas APIを使用したグラフ描画
- 外部ライブラリやフレームワークは不使用