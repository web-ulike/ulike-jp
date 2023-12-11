// 添加弹框视频

function popu(ele, type) {
  for (var i = 0; i < ele.length; i++) {
    ele[i].addEventListener("click", function (e) {
      e.preventDefault();
      var header = document.getElementsByTagName("header")[0];
      var main = document.getElementsByTagName("main")[0];
      var footer = document.getElementsByTagName("footer")[0];
      var body = document.getElementsByTagName("body")[0];
      var w = document.createElement("aside");
      var p = document.createElement("div");
      var f = document.createElement("iframe");
      document.body.style.overflow='hidden';
      document.body.style.height='100vh';
      w.setAttribute("id", "popu-cont");
      if (type === "video") {
        w.innerHTML = '<div class="popu-mask" style="position: fixed;width: 100%;height: 100%;left: 0;right: 0;z-index: 1;"></div><div class="popu-wrap text-center"><svg width="32" height="32" viewBox="0 0 24 24" class="transition-linear close-btn"> <use xlink:href="#close-path"><path d="M11 11V6a1 1 0 0 1 2 0v5h5a1 1 0 0 1 0 2h-5v5a1 1 0 0 1-2 0v-5H6a1 1 0 0 1 0-2h5z"></path></use> </svg></div>';
        var href = this.getAttribute("href");
        f.setAttribute("src", href);
        f.setAttribute("allow", "autoplay; encrypted-media");
        f.setAttribute("allowfullscreen", "allowfullscreen");
        // f.setAttribute("autoplay", "false");
        w.querySelector(".popu-wrap").appendChild(f);
        w.querySelector(".popu-wrap").appendChild(p);

      } else if (type === "image") {
        w.innerHTML = '<div class="popu-wrap text-center"><svg width="32" height="32" viewBox="0 0 24 24" class="transition-linear close-btn"> <use xlink:href="#close-path"></use> </svg></div>';
        w.querySelector(".popu-wrap").appendChild(this.cloneNode(!0))
      } else if (type === "image-other") {
        w.innerHTML = '<div class="popu-wrap popu-wrap-other text-center"><svg width="32" height="32" viewBox="0 0 24 24" class="transition-linear close-btn"> <use xlink:href="#close-path"></use> </svg></div>';
        w.querySelector(".popu-wrap").appendChild(this.cloneNode(!0))
      }
      w.querySelector(".popu-wrap").classList.add(type);
      body.appendChild(w);
      clickCloseAll(".close-btn");
      clickCloseAll(".popu-mask");
      function clickCloseAll(className) {
        document.querySelector(className).addEventListener('click', function (e) {
        document.body.style='';
          if (isIE()) {
            document.getElementById("popu-cont").removeNode(!0)
          } else {
            document.getElementById("popu-cont").remove()
          }
        })
      }
      function isIE() {
        if (!!window.ActiveXobject || "ActiveXObject" in window) {
          return !0
        } else {
          return !1
        }
      }
    })
  }
}
popu(document.getElementsByClassName('popu-video'), "video");
