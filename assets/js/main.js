"use strict";

window.addEventListener("load", onLoad);
let previewRoot;
let previewMainImg;
let previewCurrentThumbnail;

function onLoad() {
    const thumbnails = document.querySelectorAll(".gallery-item>img");
    thumbnails.forEach(tn => tn.addEventListener("click", onThumbnailClick));

    previewRoot = document.getElementById("zoom-in-view");
    previewRoot.addEventListener("click", removePreview);
    previewRoot.addEventListener("transitionend", onPreviewTransitionDone);
    document.addEventListener("keydown", onPreviewKeyPress);
    const prevDiv = document.getElementById("zoom-in-prev");
    const nextDiv = document.getElementById("zoom-in-next");
    prevDiv.addEventListener("click", onPreviousClicked);
    nextDiv.addEventListener("click", onNextClicked);
}

function onThumbnailClick() {
    previewCurrentThumbnail = this;
    //console.log(`Thumbnail clicked with base ${previewCurrentThumbnail.dataset.base}`);
    const startRect = previewCurrentThumbnail.getBoundingClientRect();
    previewMainImg = createPreviewImgElement();
    previewMainImg.classList.add("moving");
    document.getElementById("zoom-in-view").appendChild(previewMainImg);
    const largeHeight = previewCurrentThumbnail.dataset.height;
    const largeWidth = previewCurrentThumbnail.dataset.width;
    previewMainImg.style.opacity = 1;
    previewMainImg.style.top = `${Math.floor(startRect.top)}px`;
    previewMainImg.style.left = `${Math.floor(startRect.left)}px`;
    previewMainImg.style.bottom = `${Math.floor(startRect.bottom)}px`;
    previewMainImg.style.right = `${Math.floor(startRect.right)}px`;
    previewMainImg.style.width = `${Math.floor(startRect.width)}px`;
    previewMainImg.style.height = `${Math.floor(startRect.height)}px`;
    setTimeout(() => {
        previewMainImg.style.top = 0;
        previewMainImg.style.left = 0;
        previewMainImg.style.bottom = 0;
        previewMainImg.style.right = 0;
        previewMainImg.style.width = "100%";
        previewMainImg.style.height = "100%";
        // img.style.width = `${largeWidth}px`;
        // img.style.height = `${largeHeight}px`;
    }, 10);
    previewMainImg.src = getLargeImageUrl(previewCurrentThumbnail);
    previewRoot.classList.remove("invisible");
    setTimeout(() => previewRoot.style.backgroundColor = "rgba(0, 0, 0, 0.8)", 0);
}

function createPreviewImgElement()
{
    const element = document.createElement("img");
    element.addEventListener("touchmove", onPreviewTouchMove);
    element.addEventListener("touchstart", onPreviewTouchStart);
    element.addEventListener("touchend", onPreviewTouchEnd);
    element.addEventListener("touchcancel", onPreviewTouchEnd);
    return element;
}

function copyTouch({ identifier, pageX, pageY }) {
    return { identifier, pageX, pageY };
}

const trackedTouchEvents = [];

function findTouchEvent(id) {
    for (let i = 0; i < trackedTouchEvents.length; ++i) {
        if (trackedTouchEvents[i].identifier == id) {
            return i;
        }
    }

    return -1;
}


let previewAuxImg;
let touchMoveAuxLargeUrl;
let touchMoveDirection;

function onPreviewTouchMove(event) {
    if (event.touches.length > 1 || event.changedTouches.length > 1) {
        return;
    }

    for (let i = 0; i < event.changedTouches.length; ++i) {
        const touch = event.changedTouches[i];
        let idx = findTouchEvent(touch.identifier);
        if (idx < 0) {
            // ???
            trackedTouchEvents.push(copyTouch(touch));
            return;
        } else {
            const oldTouch = trackedTouchEvents[idx];
            const dx = touch.pageX - oldTouch.pageX;
            const dy = touch.pageY - oldTouch.pageY;
            //console.log(`dx: ${dx}`);
            let needUpdateUrl = !touchMoveDirection || (Math.sign(dx) != touchMoveDirection);
            if (needUpdateUrl) {
                touchMoveDirection = Math.sign(dx);
                if (dx < 0) {
                    const prevThumbnail = findElement(previewCurrentThumbnail, elem => elem.tagName === "IMG", elem => getNextThumbnail(elem));
                    if (prevThumbnail)
                    {
                        touchMoveAuxLargeUrl = getLargeImageUrl(prevThumbnail);
                    } else {
                        touchMoveAuxLargeUrl = null;
                    }
                } else if (dx > 0) {
                    const nextThumbnail = findElement(previewCurrentThumbnail, elem => elem.tagName === "IMG", elem => getPreviousThumbnail(elem));
                    if (nextThumbnail) {
                        touchMoveAuxLargeUrl = getLargeImageUrl(nextThumbnail);
                    } else {
                        touchMoveAuxLargeUrl = null;
                    }
                } else {
                    return;
                }
                console.log(`New next URL: ${touchMoveAuxLargeUrl}`);
            }
            previewMainImg.style.left = `${dx}px`;
        }
    }
}

function onPreviewTouchStart(event) {
    for (let i = 0; i < event.changedTouches.length; ++i) {
        const touch = event.changedTouches[i];
        let idx = findTouchEvent(touch.identifier); //just in case
        if (idx < 0) {
            trackedTouchEvents.push(copyTouch(touch));
            idx = trackedTouchEvents.length - 1;
        } else {
            trackedTouchEvents[idx] = copyTouch(touch);
        }
    }
    if (trackedTouchEvents.length > 0) {
        previewMainImg.classList.remove("moving");
    }
}

function onPreviewTouchEnd(event) {
    let lastStoppedTouch;
    let lastChangedTouch;
    for (let i = 0; i < event.changedTouches.length; ++i) {
        const touch = event.changedTouches[i];
        let idx = findTouchEvent(touch.identifier);
        if (idx < 0) {
            // ???
        } else {
            lastStoppedTouch = trackedTouchEvents[idx];
            lastChangedTouch = touch;
            trackedTouchEvents.splice(idx, 1);
        }
    }
    if (trackedTouchEvents.length < 1) {
        previewMainImg.classList.add("moving");
        touchMoveAuxLargeUrl = null;
        touchMoveDirection = null;
        if (lastStoppedTouch) {
            const dx = lastChangedTouch.pageX - lastStoppedTouch.pageX;
            if (Math.abs(dx) < 100) {
                setTimeout(() => {
                    previewMainImg.style.left = 0;
                }, 10);
            } else if (dx < 0) {
                advanceImage(`${dx - 100}px`, `${dx + 100}px`, getNextThumbnail, "100px", "-100px", true);
            } else {
                advanceImage(`${dx + 100}px`, `${dx - 100}px`, getPreviousThumbnail, "-100px", "100px", true);
            }
        }
    }
}

function getLargeImageUrl(thumbnailElement) {
    return `${thumbnailElement.dataset.base}/1280${thumbnailElement.dataset.extension}`;
}

function onPreviewKeyPress(event) {
    if (previewRoot.classList.contains("invisible")) {
        return;
    }

    if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousImage();
        return;
    }
    if (event.key === "ArrowRight") {
        event.preventDefault();
        nextImage();
        return;
    }
    if (event.key === "Escape") {
        event.preventDefault();
        removePreview();
        return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "PageUp" || event.key === "PageDown" || event.key === "Home" || event.key === "End") {
        event.preventDefault();
        return;
    }
}

function previousImage() {
    advanceImage("100px", "-100px", getPreviousThumbnail);
}

function nextImage() {
    advanceImage("-100px", "100px", getNextThumbnail);
}

function advanceImage(left, right, stepFunction, newLeft, newRight, cancelPreviewOnEndOfList) {
    if (!previewCurrentThumbnail) {
        return
    }

    const previousImgThumbnail = findElement(previewCurrentThumbnail, elem => elem.tagName === "IMG", elem => stepFunction(elem));
    if (!previousImgThumbnail) {
        if (cancelPreviewOnEndOfList) {
            removePreview();
        }
        return;
    }

    previewCurrentThumbnail = previousImgThumbnail;
    previewMainImg.style.left = left;
    previewMainImg.style.right = right;
    previewMainImg.style.opacity = 0;
    previewMainImg.style.zIndex = 0;
    previewMainImg.addEventListener("transitionend", function() { this.remove(); });

    previewMainImg = createPreviewImgElement();
    previewMainImg.classList.add("moving");
    document.getElementById("zoom-in-view").appendChild(previewMainImg);
    previewMainImg.src = getLargeImageUrl(previewCurrentThumbnail);
    previewMainImg.style.top = 0;
    previewMainImg.style.left = newLeft ? newLeft : right;
    previewMainImg.style.bottom = 0;
    previewMainImg.style.right = newRight ? newRight : left;
    previewMainImg.style.width = "100%";
    previewMainImg.style.height = "100%";
    previewMainImg.style.opacity = 0;
    previewMainImg.style.zIndex = 1;
    setTimeout(() => {
        previewMainImg.style.left = 0;
        previewMainImg.style.right = 0;
        previewMainImg.style.opacity = 1;
    }, 10);
}

function getPreviousThumbnail(thumbnail) {
    return advanceThumbnail(thumbnail, elem => elem.previousElementSibling);
}

function getNextThumbnail(thumbnail) {
    return advanceThumbnail(thumbnail, elem => elem.nextElementSibling);
}

function advanceThumbnail(currentThumbnail, siblingProvider) {
    const previousContainer = siblingProvider(currentThumbnail.parentElement);
    if (!previousContainer) {
        return null;
    }
    const imgs = previousContainer.getElementsByTagName("img");
    if (imgs.length > 0) {
        return imgs[0];
    }
    return null;
}

function findElement(startElement, predicate, step) {
    do {
        startElement = step(startElement);
    } while (startElement != null && !predicate(startElement));
    return startElement;
}

function removePreview() {
    previewRoot.style.opacity = 0;
    previewRoot.makeInvisible = true;
    previewCurrentThumbnail = null;
}

function onPreviewTransitionDone() {
    if (previewRoot.makeInvisible) {
        previewRoot.makeInvisible = false;
        previewRoot.classList.add("invisible");
        previewRoot.style.backgroundColor = "rgba(0, 0, 0, 0)";
        previewRoot.style.opacity = 1;

        const imgs = [];
        for (let i = 0; i < previewRoot.children.length; ++i) {
            if (previewRoot.children[i].tagName === "IMG") {
                imgs.push(previewRoot.children[i]);
            }
        }
        imgs.forEach(img => img.remove());
    }
}

function onPreviousClicked(event) {
    event.preventDefault();
    event.stopPropagation();
    previousImage();
}

function onNextClicked(event) {
    event.preventDefault();
    event.stopPropagation();
    nextImage();
}