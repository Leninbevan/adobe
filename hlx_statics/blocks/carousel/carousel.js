import {
  createTag,
  removeEmptyPTags,
} from "../../scripts/lib-adobeio.js";
/**
 * decorates the carousel
 * @param {Element} block The carousel block element
 */
export default async function decorate(block) {
  block.setAttribute("daa-lh", "carousel");
  removeEmptyPTags(block);
  reformatHyperlinkImages(block);

  const carousel_block_child = createTag("div", { class: "block-container" });
  block.append(carousel_block_child);

  const carousel_block_circle = createTag("div", {
    class: "carousel-circle-div",
  });
  block.append(carousel_block_circle);

  const carousel_section = createTag("section", { class: "slider-wrapper" });
  carousel_block_child.append(carousel_section);

  const arrow_button_previous = createTag("button", { class: "slide-arrow" });
  arrow_button_previous.classList.add("slide-arrow-previous");
  arrow_button_previous.innerHTML = "&#8249;";
  arrow_button_previous.ariaLabel = "backward arrow";
  const arrow_button_forward = createTag("button", { class: "slide-arrow" });
  arrow_button_forward.classList.add("slide-arrow-forward");
  arrow_button_forward.innerHTML = "&#8250;";
  arrow_button_forward.ariaLabel = "forward arrow";
  const carousel_ul = createTag("ul", { class: "slides-container" });
  carousel_section.append(carousel_ul);

  //add a count to keep track of which slide is showing
  let count = 1;

  //load the video link.
  const a = block.querySelectorAll("a");
  const videoLinks = Array.from(a).filter(link => 
    link.title.includes('https')
  );
  for (let i = 0; i < videoLinks.length; i++) {
    loadVideoURL(block, videoLinks[i]);
  }

  block.querySelectorAll(':scope > div:not([class]) > div:not([class])').forEach((innerDiv, index) => {
    // one outer div for each slide - add class to inner div and remove outerDiv
    innerDiv.classList.add("carousel-container");
    innerDiv.parentElement.replaceWith(carousel_block_child);    
    innerDiv.setAttribute("id", `carouselTab-${index}`);
    
    //add circle for every slide
    const div_slide_circle = block.querySelector(".carousel-circle-div");
    const circle_button = createTag("button", { class: "carousel-circle" });
    circle_button.setAttribute("id", count);
    circle_button.ariaLabel = `Slide ${count}`;
    div_slide_circle.append(circle_button);
    count += 1;

    const carousel_li = createTag("li", { class: "slide" });
    carousel_ul.append(carousel_li);
    carousel_li.append(innerDiv);

    //add everything but image to the text div
    const flex_div = createTag("div", { id: "text-flex-div-" + `carouselTab-${index}`});
    flex_div.classList.add("text-container");
    innerDiv.append(flex_div);
    
    innerDiv.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      h.classList.add(
        "spectrum-Heading",
        "spectrum-Heading--sizeL",
        "carousel-heading"
      );
      flex_div.append(h);  
    });

    const button_div = createTag("div", { id: "button-div-" + `carouselTab-${index}`});
    flex_div.append(button_div);
  });

  carousel_block_child.insertBefore(arrow_button_previous, carousel_section);
  carousel_block_child.append(arrow_button_forward);

  //add id to image and add image to left div
  block.querySelectorAll("img").forEach((img) => {
    // checks if dealing with a hyperlinked image
    if (img.parentElement.parentElement.tagName === "A") {
      // if so, adds an extra ".parentElement" becuase image is wrapped in ancor tag
      img.parentElement.parentElement.parentElement.classList.add("IMAGE");
      //add image to left div
      let flex_div = createTag("div", {
        id:
          "media-flex-div-" +
          img.parentElement.parentElement.parentElement.parentElement.id,
      });
      img.parentElement.parentElement.parentElement.parentElement.append(
        flex_div
      );
      flex_div.append(img.parentElement.parentElement.parentElement);
      flex_div.classList.add("media-container");
    } else {
      img.parentElement.parentElement.classList.add("IMAGE");
      //add image to left div
      let flex_div = createTag("div", {
        id: "media-flex-div-" + img.parentElement.parentElement.parentElement.id,
      });

      img.parentElement.parentElement.parentElement.prepend(flex_div);
      flex_div.append(img.parentElement.parentElement);
      flex_div.classList.add("media-container");
    }
  });

  //add id to image and add image to left div
  block.querySelectorAll(".video-element").forEach((vid) => {
    //add image to left div
    vid.id = "media-flex-div-" + vid.parentElement.parentElement.id;
    vid.classList.add("media-container");
  });

  block.querySelectorAll("p").forEach(function (p) {
    //add everything but image to the right div
    if (p.classList.contains("IMAGE")) {
      p.classList.add("image-container");
    } else {
      let button_div = block.querySelector(
        "[id=button-div-" + p.parentElement.id + "]"
      );
      if (p.classList.contains("button-container")) {
        button_div.classList.add("carousel-button-container");
        button_div.append(p);
      } else {
        let flex_div = block.querySelector(
          "[id=text-flex-div-" + p.parentElement.id + "]"
        );
        //changing class list of p tags for icons
        if (p.querySelector("span")) {
          // Add a class to the <p> tag
          p.classList.add("icon-container");
          const icon_link = p.querySelector("a");
          if(icon_link){
            icon_link.classList.add("spectrum-Link", "spectrum-Link--quiet");
          }
        }else{
          flex_div.setAttribute("class", "text-container");
          p.classList.add("spectrum-Body", "spectrum-Body--sizeM");
        }
        flex_div.insertBefore(p, button_div);
      }
    }
  });

  block.querySelectorAll('div.text-container').forEach((text_container) => {
    const prevElement = text_container.querySelector('p.icon-container')?.previousElementSibling;
    const productLinkContainer = createTag('div', { class: 'product-link-container' });

    // Maintains order within carousel text container
    if (prevElement) { // at the beginning of the div
      text_container.querySelectorAll('p.icon-container').forEach((innerLink) => {productLinkContainer.append(innerLink)}); 
      prevElement.after(productLinkContainer);
    };

  });

  //slide functionality with arrow buttons
  const slidesContainer = block.querySelector(".slides-container");
  const slide = block.querySelector(".slide");
  const prevButton = block.querySelector(".slide-arrow-previous");
  const nextButton = block.querySelector(".slide-arrow-forward");

  //for automatic scrolling
  let isPaused = false;

  nextButton.addEventListener("click", () => {
    isPaused = true;
    const slide_selected = block.querySelector(".carousel-circle-selected");
    const slide_selected_num = parseInt(slide_selected.id);
    const new_slide_num =
      slide_selected_num === count - 1 ? 1 : slide_selected_num + 1;
    const slideDx =
      slidesContainer.clientLeft + slide.clientWidth * (new_slide_num - 1);
    slidesContainer.scrollLeft = slideDx;
    const new_slide = block.querySelector(
      "[id=" + CSS.escape(new_slide_num) + "]"
    );
    slide_selected.classList.remove("carousel-circle-selected");
    new_slide.classList.add("carousel-circle-selected");
  });

  prevButton.addEventListener("click", () => {
    isPaused = true;
    const slide_selected = block.querySelector(".carousel-circle-selected"); //should only be one in the block
    const slide_selected_num = parseInt(slide_selected.id);
    const new_slide_num =
      slide_selected_num === 1 ? count - 1 : slide_selected_num - 1;
    //slide over to new slide
    const slideDx = (new_slide_num - 1) * slide.clientWidth;
    slidesContainer.scrollLeft = slideDx;
    //change color of circle
    const new_slide = block.querySelector(
      "[id=" + CSS.escape(new_slide_num) + "]"
    );
    slide_selected.classList.remove("carousel-circle-selected");
    new_slide.classList.add("carousel-circle-selected");
  });

  // Function to check if mobile screen (matching css width)
  function isMobileScreen() {
    return window.innerWidth <= 700;
  }

  // Swipe detection for mobile screens
  let touchStartX = 0;
  let touchEndX = 0;

  block.addEventListener("touchstart", (e) => {
    if (isMobileScreen()) {
      touchStartX = e.changedTouches[0].screenX; // start point of swipe
    }
  });

  block.addEventListener("touchend", (e) => {
    if (isMobileScreen()) {
      touchEndX = e.changedTouches[0].screenX; // end point of swipe
      handleSwipe();
    }
  });

  // handle swipe gestures
  function handleSwipe() {
    const nextButton = block.querySelector(".slide-arrow-forward");
    const prevButton = block.querySelector(".slide-arrow-previous");

    if (touchEndX < touchStartX) {
      // Swiped left, trigger next slide
      nextButton.click();
    } else if (touchEndX > touchStartX) {
      // Swiped right, trigger previous slide
      prevButton.click();
    }
  }

  /**
   * For images that have hyperlinks attached to them in Google Docs, they are wrapped in an anchor tag, which messes up
   * formatting the carousel slide. This function reformats the images/links so they are in a similar format to other slides
   */
  function reformatHyperlinkImages(block) {
    // Selects all hyper linked images
    block.querySelectorAll("div.embed.block > div > div > a").forEach((a) => {
      const picture = a.firstElementChild.firstElementChild;
      if (picture) {
        a.append(picture);
        a.removeChild(a.firstElementChild);
      }
      const paragraphWrapper = createTag("p", {});
      // Because of link, image is surrounded by numerous divs. Navigates back up to OG parent
      const newDivParent =
        a.parentElement.parentElement.parentElement.parentElement;
      a.parentElement.removeChild(a);
      paragraphWrapper.append(a);
      // pulls out the old image container and replaces it with pargraph-wrapped image
      // Format is same as other slides
      newDivParent.replaceChild(
        paragraphWrapper,
        newDivParent.firstElementChild
      );
    });
  }

  //change color of circle button when clicked
  const buttons = block.querySelectorAll(".carousel-circle");
  buttons[0].classList.add("carousel-circle-selected"); //when reloading first slide should be selected

  buttons.forEach((button, i) => {
    button.addEventListener("click", () => {
      isPaused = true;
      let new_slide_num = button.id;
      const slideDx =
        slidesContainer.clientLeft + slide.clientWidth * (new_slide_num - 1);
      slidesContainer.scrollLeft = slideDx;
      //change circle color
      buttons.forEach((button) =>
        button.classList.remove("carousel-circle-selected")
      );
      button.classList.add("carousel-circle-selected");
    });
  });


  // load the video url and append to the video element.
  function loadVideoURL(block, a) {
    // block.className = "carousel";
    const link = a.href;
    const url = new URL(link);
    a.insertAdjacentHTML("afterend", loadUrl(url));
    const videoElement = createTag("div", { class: "video-element" });
    videoElement.innerHTML = a.parentElement.innerHTML;
    a.parentElement.parentElement.append(videoElement);
    
    a.parentElement.remove();
    videoElement.querySelector("a").remove();
    videoElement.parentElement.classList.remove("button-container")
  }

  function loadUrl(url) {
    let html;
    const embed = url.pathname;
    // Check if the URL is a youtube link.
    const usp = new URLSearchParams(url.search);
    let vid = encodeURIComponent(usp.get("v"));
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)/;
    if (url.origin.includes("youtu.be")) {
      vid = url.pathname.split("/")[1];
    }
    // allow autoplay to be specified in the section metadata.
    const autoPlay = block.classList.contains("autoplay");

    if (youtubeRegex.test(url)) {
      let dataSource = "https://www.youtube.com";
      dataSource += vid ? "/embed/" + vid + "?rel=0&v=" + vid : embed;
      // if autoplay is true, append autoplay to the datasource.
      dataSource =
        autoPlay ? dataSource + "&autoplay=1&mute=1" : dataSource;
      // Render the youtube link through iframe within right container of one of the video carousel slide.
      html = `<div style="left: 0; width: 560px; height: 320px; position: relative; ">
      <img loading="lazy" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
        src="https://i.ytimg.com/vi_webp/${vid}/maxresdefault.webp">
          <iframe data-src="${dataSource}" allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
      </img>
     </div>`;
    } else {
      // Render the url link through video tag within right container of one of the video carousel slide.
      // if autoplay is true, add autoplay attribute to the video tag.
      html = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
        <video controls loading="lazy" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" ${
          autoPlay ? `autoplay="true"` : ""
        } preload="metadata" playsinline muted>
          <source src="${url}" />
        </video>
      </div>`;
    }
    return html;
  }

  //automatic scrolling
  function advanceSlide() {
    let slide_selected = block.querySelector(".carousel-circle-selected");
    let slide_selected_num = parseInt(slide_selected.id);
    let new_slide_num = slide_selected_num + 1;
    let new_slide;
    if (new_slide_num === count) {
      //at last slide - can't go forward more
      new_slide = block.querySelector("[id=" + CSS.escape(1) + "]");
      //change color of circle
      slide_selected.classList.remove("carousel-circle-selected");
      new_slide.classList.add("carousel-circle-selected");
      //slide over to new slide - needs to start over
      const difference = count - 1 - 1;
      const slideWidth = slide.clientWidth;
      slidesContainer.scrollLeft -= difference * slideWidth;
    } else {
      //slide over to new slide
      const slideDx =
        slidesContainer.clientLeft + slide.clientWidth * slide_selected_num;
      slidesContainer.scrollLeft = slideDx;
      //change color of circle
      new_slide = block.querySelector("[id=" + CSS.escape(new_slide_num) + "]");
      new_slide.classList.add("carousel-circle-selected");
      slide_selected.classList.remove("carousel-circle-selected");
    }
  }

  const timeout = 9000;
  function slideTimer() {
    if (!isPaused) {
      advanceSlide();
      setTimeout(slideTimer, timeout);
    } else {
      clearTimeout(timer);
      //after set amount of time automatic scrolling can commence
      setTimeout(() => {
        isPaused = false;
      }, 2 * timeout);
      setTimeout(slideTimer, timeout);
    }
  }

  const timer = setTimeout(slideTimer, timeout);
  timer;
}
