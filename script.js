class Graph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.vertices = [];
        this.edges = [];
        this.selectedVertex = null;
        this.vertexRadius = 20;
        this.isDragging = false;
        this.draggedVertex = null;
        this.contextMenuTarget = null;
        
        // 履歴管理用の配列
        this.history = [];
        this.currentState = this.getState();
        
        // undoボタンの参照を保持
        this.undoButton = document.getElementById('undoButton');
        this.contextMenu = document.getElementById('contextMenu');
        this.deleteItem = document.getElementById('deleteItem');
        this.setWeightItem = document.getElementById('setWeightItem');
        
        // キャンバスのサイズを設定
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // イベントリスナーの設定
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        // コンテキストメニューのイベントリスナー
        this.deleteItem.addEventListener('click', () => this.handleDelete());
        this.setWeightItem.addEventListener('click', () => this.handleSetWeight());
        document.addEventListener('click', () => this.hideContextMenu());

        // 表示形式の切り替えイベントを設定
        document.querySelectorAll('input[name="format"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateAdjacencyMatrix());
        });

        // グラフタイプの切り替えイベントを設定
        document.querySelectorAll('input[name="graph-type"]').forEach(radio => {
            radio.addEventListener('change', () => this.resetGraph());
        });

        // undoボタンのイベントリスナーを設定
        this.undoButton.addEventListener('click', () => this.undo());

        // 表示形式の切り替えイベントを設定
        this.showWeights = true; // 初期状態は重みを表示
        this.toggleWeightDisplay = document.getElementById('toggleWeightDisplay');
        this.toggleWeightDisplay.addEventListener('change', () => {
            this.showWeights = this.toggleWeightDisplay.checked;
            this.draw();
        });

        // 初期描画
        this.draw();

        this.clearButton = document.getElementById('clearButton');
        this.clearButton.addEventListener('click', () => this.clearGraph());
    }

    // 現在の状態を取得
    getState() {
        return {
            vertices: this.vertices.map(v => ({ ...v })),
            edges: this.edges.map(e => ({ ...e }))
        };
    }

    // 状態を保存
    saveState() {
        this.history.push(this.currentState);
        this.currentState = this.getState();
        this.undoButton.disabled = false;
    }

    // 状態を復元
    setState(state) {
        this.vertices = state.vertices.map(v => ({ ...v }));
        this.edges = state.edges.map(e => ({ ...e }));
        this.selectedVertex = null;
        this.isDragging = false;
        this.draggedVertex = null;
    }

    // 操作を元に戻す
    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            this.setState(previousState);
            this.currentState = this.getState();
            this.undoButton.disabled = this.history.length === 0;
            this.draw();
            this.updateAdjacencyMatrix();
        }
    }

    resetGraph() {
        this.vertices = [];
        this.edges = [];
        this.selectedVertex = null;
        this.isDragging = false;
        this.draggedVertex = null;
        this.history = [];
        this.currentState = this.getState();
        this.undoButton.disabled = true;
        this.draw();
        this.updateAdjacencyMatrix();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.draw();
    }

    handleDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 新しい頂点を追加
        this.saveState();
        this.vertices.push({ x, y, id: this.vertices.length });
        this.draw();
        this.updateAdjacencyMatrix();
    }

    handleMouseDown(event) {
        if (this.selectedVertex !== null) return; // 辺追加モード中は無効

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // クリックされた頂点を探す
        const clickedVertex = this.vertices.find(v => 
            Math.hypot(x - v.x, y - v.y) <= this.vertexRadius
        );

        if (clickedVertex) {
            this.isDragging = true;
            this.draggedVertex = clickedVertex;
            // ドラッグ開始時の状態を保存
            this.saveState();
        }
    }

    handleMouseMove(event) {
        if (!this.isDragging || !this.draggedVertex) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 頂点の位置を更新
        this.draggedVertex.x = Math.max(this.vertexRadius, 
            Math.min(x, this.canvas.width - this.vertexRadius));
        this.draggedVertex.y = Math.max(this.vertexRadius, 
            Math.min(y, this.canvas.height - this.vertexRadius));

        this.draw();
    }

    handleMouseUp() {
        this.isDragging = false;
        this.draggedVertex = null;
    }

    handleClick(event) {
        if (this.isDragging) return; // ドラッグ中のクリックは無視

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // クリックされた頂点を探す
        const clickedVertex = this.vertices.find(v => 
            Math.hypot(x - v.x, y - v.y) <= this.vertexRadius
        );

        if (clickedVertex) {
            if (this.selectedVertex === null) {
                // 最初の頂点を選択
                this.selectedVertex = clickedVertex;
            } else if (this.selectedVertex === clickedVertex) {
                // 同じ頂点をクリックした場合は選択を解除
                this.selectedVertex = null;
            } else {
                // 辺を追加
                const edge = {
                    from: this.selectedVertex.id,
                    to: clickedVertex.id,
                    weight: 1  // デフォルトの重みを1に設定
                };
                
                const isUndirected = document.querySelector('input[name="graph-type"]:checked').value === 'undirected';
                
                // 重複チェック
                const isDuplicate = this.edges.some(e => 
                    isUndirected ? 
                        (e.from === edge.from && e.to === edge.to) ||
                        (e.from === edge.to && e.to === edge.from) :
                        (e.from === edge.from && e.to === edge.to)
                );

                if (!isDuplicate) {
                    this.saveState();
                    this.edges.push(edge);
                    this.updateAdjacencyMatrix();
                }
                this.selectedVertex = null;
            }
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const isDirected = document.querySelector('input[name="graph-type"]:checked').value === 'directed';

        // 辺を描画
        this.edges.forEach(edge => {
            const from = this.vertices[edge.from];
            const to = this.vertices[edge.to];
            
            // 線を描画
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.strokeStyle = '#666';
            this.ctx.stroke();

            // 辺の重みを描画（チェックボックスがオンの場合）
            if (this.showWeights) {
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                this.ctx.fillStyle = '#000';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.font = '14px Arial';
                // 背景を白く塗りつぶして見やすくする
                const weight = edge.weight.toString();
                const metrics = this.ctx.measureText(weight);
                const padding = 2;
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(
                    midX - metrics.width/2 - padding,
                    midY - 7 - padding,
                    metrics.width + padding * 2,
                    14 + padding * 2
                );
                this.ctx.fillStyle = '#000';
                this.ctx.fillText(weight, midX, midY);
            }

            // 有向グラフの場合は矢印を描画
            if (isDirected) {
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const arrowLength = 15;
                const arrowWidth = 8;

                // 矢印の先端の位置を計算（頂点の円の手前に配置）
                const endX = to.x - this.vertexRadius * Math.cos(angle);
                const endY = to.y - this.vertexRadius * Math.sin(angle);

                // 矢印を描画
                this.ctx.beginPath();
                this.ctx.moveTo(
                    endX - arrowLength * Math.cos(angle - Math.PI/6),
                    endY - arrowLength * Math.sin(angle - Math.PI/6)
                );
                this.ctx.lineTo(endX, endY);
                this.ctx.lineTo(
                    endX - arrowLength * Math.cos(angle + Math.PI/6),
                    endY - arrowLength * Math.sin(angle + Math.PI/6)
                );
                this.ctx.strokeStyle = '#666';
                this.ctx.stroke();
            }
        });

        // 頂点を描画
        this.vertices.forEach(vertex => {
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.vertexRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = vertex === this.selectedVertex ? '#ff9999' : '#fff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.stroke();

            // 頂点番号を描画
            this.ctx.fillStyle = '#000';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(vertex.id.toString(), vertex.x, vertex.y);
        });
    }

    updateAdjacencyMatrix() {
        const n = this.vertices.length;
        const format = document.querySelector('input[name="format"]:checked').value;
        const isUndirected = document.querySelector('input[name="graph-type"]:checked').value === 'undirected';
        const matrixElement = document.getElementById('adjacencyMatrix');

        if (format === 'matrix') {
            // 隣接行列形式（重み付き）
            const matrix = Array(n).fill().map(() => Array(n).fill(0));
            this.edges.forEach(edge => {
                matrix[edge.from][edge.to] = edge.weight;
                if (isUndirected) {
                    matrix[edge.to][edge.from] = edge.weight;
                }
            });
            matrixElement.textContent = '[\n' + 
                matrix.map(row => '    [' + row.join(', ') + ']').join(',\n') +
                '\n]';
        } else {
            // 隣接リスト形式（重み付き）
            const adjList = Array(n).fill().map(() => []);
            this.edges.forEach(edge => {
                adjList[edge.from].push([edge.to, edge.weight]);
                if (isUndirected) {
                    adjList[edge.to].push([edge.from, edge.weight]);
                }
            });
            // 各頂点の隣接リストをソートして見やすくする
            adjList.forEach(list => list.sort((a, b) => a[0] - b[0]));
            matrixElement.textContent = '[\n' + 
                adjList.map(list => '    [' + list.map(([v, w]) => `[${v}, ${w}]`).join(', ') + ']').join(',\n') +
                '\n]';
        }
    }

    // コンテキストメニューを表示
    showContextMenu(x, y) {
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        
        // 辺が選択されている場合のみ重み設定メニューを表示
        this.setWeightItem.style.display = 
            this.contextMenuTarget && this.contextMenuTarget.type === 'edge' ? 'block' : 'none';
    }

    // コンテキストメニューを非表示
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.contextMenuTarget = null;
    }

    // 右クリックメニューの処理
    handleContextMenu(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // クリックされた頂点を探す
        const clickedVertex = this.vertices.find(v => 
            Math.hypot(x - v.x, y - v.y) <= this.vertexRadius
        );

        if (clickedVertex) {
            this.contextMenuTarget = { type: 'vertex', vertex: clickedVertex };
            this.showContextMenu(event.clientX, event.clientY);
            return;
        }

        // クリックされた辺を探す
        const clickedEdge = this.findClickedEdge(x, y);
        if (clickedEdge) {
            this.contextMenuTarget = { type: 'edge', edge: clickedEdge };
            this.showContextMenu(event.clientX, event.clientY);
        }
    }

    // クリックされた辺を見つける
    findClickedEdge(x, y) {
        const threshold = 5; // クリック判定の許容範囲

        return this.edges.find(edge => {
            const from = this.vertices[edge.from];
            const to = this.vertices[edge.to];
            
            // 線分と点の距離を計算
            const d = this.pointToLineDistance(x, y, from.x, from.y, to.x, to.y);
            
            // 点が線分上にあるかチェック
            if (d <= threshold) {
                const minX = Math.min(from.x, to.x) - threshold;
                const maxX = Math.max(from.x, to.x) + threshold;
                const minY = Math.min(from.y, to.y) - threshold;
                const maxY = Math.max(from.y, to.y) + threshold;
                
                return x >= minX && x <= maxX && y >= minY && y <= maxY;
            }
            return false;
        });
    }

    // 点と線分の距離を計算
    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    // 削除処理
    handleDelete() {
        if (!this.contextMenuTarget) return;

        this.saveState();

        if (this.contextMenuTarget.type === 'vertex') {
            const vertex = this.contextMenuTarget.vertex;
            // 頂点を削除
            const index = this.vertices.findIndex(v => v === vertex);
            this.vertices.splice(index, 1);
            // 関連する辺を削除
            this.edges = this.edges.filter(e => e.from !== vertex.id && e.to !== vertex.id);
            // 残りの頂点のIDを振り直す
            this.vertices.forEach((v, i) => v.id = i);
            // 残りの辺のfromとtoを更新
            this.edges.forEach(e => {
                if (e.from > index) e.from--;
                if (e.to > index) e.to--;
            });
        } else if (this.contextMenuTarget.type === 'edge') {
            const edge = this.contextMenuTarget.edge;
            // 辺を削除
            const index = this.edges.findIndex(e => 
                e.from === edge.from && e.to === edge.to
            );
            this.edges.splice(index, 1);
        }

        this.hideContextMenu();
        this.draw();
        this.updateAdjacencyMatrix();
    }

    // 重み設定処理
    handleSetWeight() {
        if (!this.contextMenuTarget || this.contextMenuTarget.type !== 'edge') return;

        const edge = this.contextMenuTarget.edge;
        const weight = prompt('辺の重みを入力してください:', edge.weight);
        
        if (weight !== null) {
            const numWeight = parseFloat(weight);
            if (!isNaN(numWeight) && numWeight > 0) {
                this.saveState();
                edge.weight = numWeight;
                this.draw();
                this.updateAdjacencyMatrix();
            } else {
                alert('正の数値を入力してください。');
            }
        }

        this.hideContextMenu();
    }

    // グラフをクリア
    clearGraph() {
        this.saveState();
        this.vertices = [];
        this.edges = [];
        this.selectedVertex = null;
        this.isDragging = false;
        this.draggedVertex = null;
        this.history = [];
        this.currentState = this.getState();
        this.undoButton.disabled = true;
        this.draw();
        this.updateAdjacencyMatrix();
    }
}

// グラフの初期化
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graphCanvas');
    new Graph(canvas);
}); 