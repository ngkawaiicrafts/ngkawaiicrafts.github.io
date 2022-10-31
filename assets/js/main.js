"use strict";

window.addEventListener("load", onLoad);
let previewRoot;

function onLoad() {
    const thumbnails = document.querySelectorAll(".gallery-item>img");
    thumbnails.forEach(tn => tn.addEventListener("click", onThumbnailClick));

    previewRoot = document.getElementById("zoom-in-view");
    previewRoot.addEventListener("click", removePreview);
    previewRoot.addEventListener("transitionend", onPreviewTransitionDone);
}

function onThumbnailClick() {
    console.log(`Thumbnail clicked with base ${this.dataset.base}`);
    const startRect = this.getBoundingClientRect();
    const img = previewRoot.getElementsByTagName("img")[0];
    const largeHeight = this.dataset.height;
    const largeWidth = this.dataset.width;
    //img.classList.remove("moving");
    img.style.top = `${Math.floor(startRect.top)}px`;
    img.style.left = `${Math.floor(startRect.left)}px`;
    img.style.bottom = `${Math.floor(startRect.bottom)}px`;
    img.style.right = `${Math.floor(startRect.right)}px`;
    img.style.width = `${Math.floor(startRect.width)}px`;
    img.style.height = `${Math.floor(startRect.height)}px`;
    img.classList.add("moving");
    setTimeout(() => {
        img.style.top = 0;
        img.style.left = 0;
        img.style.bottom = 0;
        img.style.right = 0;
        img.style.width = "100%";
        img.style.height = "100%";
        // img.style.width = `${largeWidth}px`;
        // img.style.height = `${largeHeight}px`;
    }, 0);
    img.src = `${this.dataset.base}/1280${this.dataset.extension}`;
    previewRoot.classList.remove("invisible");
    setTimeout(() => previewRoot.style.backgroundColor = "rgba(0, 0, 0, 0.8)", 0);
}

function removePreview() {
    previewRoot.style.opacity = 0;
    previewRoot.makeInvisible = true;
}

function onPreviewTransitionDone() {
    if (previewRoot.makeInvisible) {
        previewRoot.makeInvisible = false;
        previewRoot.classList.add("invisible");
        previewRoot.style.backgroundColor = "rgba(0, 0, 0, 0)";
        previewRoot.style.opacity = 1;
    }
}