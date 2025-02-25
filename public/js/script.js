document.addEventListener("DOMContentLoaded", function () {
    console.log("HerVerse Loaded Successfully!");

    document.querySelector(".btn").addEventListener("mouseover", function () {
        this.style.backgroundColor = "#d63384";
        this.style.color = "white";
    });

    document.querySelector(".btn").addEventListener("mouseout", function () {
        this.style.backgroundColor = "white";
        this.style.color = "#d63384";
    });
});
