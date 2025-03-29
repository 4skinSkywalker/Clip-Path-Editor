const ctrlWidth = document.getElementById("ctrlWidth");
const ctrlHeight = document.getElementById("ctrlHeight");
const ctrlGridSize = document.getElementById("ctrlGridSize");
const ctrlSnap = document.getElementById("ctrlSnap");
const ctrlFile = document.getElementById("ctrlFile");
const elCanvasWrap = document.getElementById("canvas-wrap");
const elCanvas = document.getElementById("canvas");
const imgElement = document.getElementById("image");
const clipPath = document.getElementById("clip-path");
const clipPathHistory = document.getElementById("clip-path-history");
let width = 600;
let height = 400;
let gridSize = 20;
let histOfPts = [];
let pts = [];
let selPt;
let zoom = 1;

function setWidth(w) {
    width = w;
    ctrlWidth.value = w;
    elCanvasWrap.style.width = w + "px";
}

function setHeight(h) {
    height = h;
    ctrlHeight.value = h;
    elCanvasWrap.style.height = h + "px";
}

function setGridSize(px) {
    gridSize = px;
    ctrlGridSize.value = px;
    const divx = width / (2 * px);
    const divy = height / (2 * px);
    elCanvas.style.backgroundSize = `${width / divx}px ${height / divy}px`;
}

function applyClipPath() {
    const { x: ox, y: oy } = elCanvas.getBoundingClientRect();
    const clipPathPoly = `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
    imgElement.style.clipPath = clipPathPoly;
    clipPath.innerText = `clip-path: ${clipPathPoly};`;
}

function assignPtPos(evt) {
    const { x: ox, y: oy } = elCanvas.getBoundingClientRect();
    let x = evt.clientX - ox;
    let y = evt.clientY - oy;
    if (ctrlSnap.checked) {
        const _gridSize = gridSize * zoom;
        x = Math.round(x / _gridSize) * _gridSize;
        y = Math.round(y / _gridSize) * _gridSize;
    }
    return [
        parseInt(((100 / zoom) * x / width)),
        parseInt(((100 / zoom) * y / height))
    ];
}

function selectPoint(pt) {
    selPt = pt;
    pts.forEach(pt => pt._ptEl.classList.remove("sel"));
    pt._ptEl.classList.add("sel");
}

function createPt(pt) {
    const mouseMoveHandler = evt => {
        const [x, y] = assignPtPos(evt);
        pt[0] = x;
        pt[1] = y;
        ptEl.style.left = pt[0] + "%";
        ptEl.style.top = pt[1] + "%";
        applyClipPath();
    };

    const ptEl = document.createElement("DIV");
    ptEl.classList.add("pt");
    ptEl.style.left = pt[0] + "%";
    ptEl.style.top = pt[1] + "%";

    ptEl.addEventListener("mousedown", () => {
        selectPoint(pt);
        document.addEventListener("mousemove", mouseMoveHandler);
    });

    document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
    });

    return ptEl;
}

function renderPts() {
    elCanvas.innerHTML = "";
    for (const pt of pts) {
        const ptEl = createPt(pt);
        pt._ptEl = ptEl;
        elCanvas.appendChild(ptEl);
    }
    setTimeout(() => applyClipPath(), 100);
}

function addPoint(evt) {
    const pt = evt ? assignPtPos(evt) : [50, 50];
    pts.push(pt);
    renderPts();
    selectPoint(pt);
}

function removePoint(evt, pt, refreshClipPath = true) {
    const ptToDel = pt || selPt;
    pts = pts.filter(pt => pt !== ptToDel);
    elCanvas.removeChild(ptToDel._ptEl);
    if (refreshClipPath) {
        setTimeout(() => applyClipPath(), 100);
    }
}

function removeAllPoints() {
    pts.forEach(pt => removePoint(null, pt, false));
}

function deleteHistEntry(pts) {
    histOfPts = histOfPts.filter(_pts => _pts !== pts);
    renderHistOfPts();
}

function createHistEntry(_pts, idx) {
    const el = document.createElement("DIV");
    el.innerHTML = `<div class="hist-entry">
  <div class="hist-entry-path">Saved entry ${idx}</div>
  <div class="hist-entry-delete">🗙</div>
</div>`;

    const histEntryEl = el.querySelector(".hist-entry");
    histEntryEl.addEventListener("click", () => {
        pts = _pts;
        [...document.querySelectorAll(".hist-entry")]
            .forEach(el => el.classList.remove("sel"));
        histEntryEl.classList.add("sel");
        renderPts();
    });

    const histEntryDelEl = el.querySelector(".hist-entry-delete");
    histEntryDelEl.addEventListener("click", evt => {
        evt.stopPropagation();
        deleteHistEntry(_pts);
    });

    return el.firstChild;
}

function renderHistOfPts() {
    clipPathHistory.innerHTML = "";
    for (let i = 0; i < histOfPts.length; i++) {
        const histEntry = createHistEntry(histOfPts[i], i);
        clipPathHistory.appendChild(histEntry);
    }
}

function savePoints() {
    histOfPts.push([...pts.map(pt => [pt[0], pt[1]])]);
    renderHistOfPts();
}

function loadImage(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        imgElement.style.backgroundImage = `url('${e.target.result}')`;
        imgElement.style.backgroundSize = "cover";
        imgElement.style.backgroundPosition = "center";
    };
    reader.readAsDataURL(file);
}

function copyText(text) {
    const textarea = document.createElement("textarea");
    textarea.textContent = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
}

window.oncontextmenu = (evt) => {
    evt.preventDefault();
    removePoint();
    setTimeout(() => applyClipPath(), 100);
}
elCanvasWrap.addEventListener("dblclick", addPoint);
ctrlWidth.addEventListener("input", () => setWidth(ctrlWidth.value));
ctrlHeight.addEventListener("input", () => setHeight(ctrlHeight.value));
ctrlGridSize.addEventListener("input", () => setGridSize(ctrlGridSize.value));
ctrlFile.addEventListener("change", loadImage);
elCanvasWrap.addEventListener("wheel", evt => {
    zoom += Math.sign(evt.deltaY) * 0.05;
    elCanvasWrap.style.transform = `scale(${zoom})`;
});
clipPath.addEventListener("click", () => {
    const feedback = "Copied to clipboard!";
    if (clipPath.innerText === feedback) {
        return;
    }
    const prevText = clipPath.innerText;
    copyText(prevText);
    clipPath.innerText = feedback;
    setTimeout(() => clipPath.innerText = prevText, 2000);
});

(function () {
    setWidth(width);
    setHeight(height);
    setGridSize(gridSize);
})();