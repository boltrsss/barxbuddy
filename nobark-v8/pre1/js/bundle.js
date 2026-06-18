window.addEventListener("DOMContentLoaded", function () {
  sessionStorage.clear();
  successURL = "/int1";

  if (typeof campaign !== "undefined") {
    campaign.captureURLParams();
    document.querySelectorAll(".go-to-offer").forEach((a) => {
      a.href = campaign.getSuccessUrl(successURL);
    });
  }
});

window.addEventListener("load", function () {
  const interval = setInterval(() => {
    if (typeof nextCampaign !== "undefined") {
      clearInterval(interval);
      nextCampaign.config({
        apiKey: "qXUmotj4qwCACcUDw1oQYUbQH2F51g53jmOxUUdT",
      });
      nextCampaign.event("page_view", {
        title: document.title,
        url: window.location.href,
      });
    }
  }, 100);
});

document.addEventListener("DOMContentLoaded", function () {
  const el = document.getElementById("published-date");
  if (el) el.innerText = getDate(-2);
});

document.addEventListener("DOMContentLoaded", function () {
  $(document).scroll(function () {
    const $elem = $(".footer");
    const $window = $(window);

    const docViewTop = $window.scrollTop();
    const docViewBottom = docViewTop + $window.height();

    const elemTop = $elem.offset().top;

    if (
      elemTop >= docViewBottom + 20 ||
      elemTop + $(".footer-cta").height() >= docViewBottom + 134
    ) {
      $(".footer-cta").css("position", "fixed").css("display", "block");
    } else {
      $(".footer-cta").css("position", "relative").css("display", "block");
    }

    const winscroll = $(window).scrollTop();
    const scrlCp = $("#check-sec").offset().top;

    if (winscroll < scrlCp) {
      $(".btmfix").fadeOut();
    } else {
      $(".btmfix").fadeIn();
    }
  });
});
