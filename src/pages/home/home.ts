$(".installation-types").children().on("click", event => {
	selectOs(event.target.id as Os);
});

type Os = "windows" | "linux" | "unknown" | "mac";

function getOs(): Os {
	if (navigator.userAgent.toLowerCase().includes("win")) return "windows";
	if (navigator.userAgent.toLowerCase().includes("linux")) return "linux";
	if (navigator.userAgent.toLowerCase().includes("mac")) return "mac";
	return "unknown";
}

function selectOs(os: Os): void {
	$(".installation-types").children().addClass("inactive");
	switch (os) {
		case "windows":
			$(".windows-installation").removeClass("inactive");
			$(".install-command").text("Sorry! No Windows binary releases available yet :(");
			$(".install-command").css({ color: "lightcoral", fontFamily: "Nunito" });
			break;
		case "mac":
			$(".mac-installation").removeClass("inactive");
			$(".install-command").text("Sorry! Homebrew is not yet supported :(");
			$(".install-command").css({ color: "lightcoral", fontFamily: "Nunito" });
			break;
		case "linux":
			$(".linux-installation").removeClass("inactive");
			$(".install-command").text("Sorry! Linux packages are not yet supported :(");
			$(".install-command").css({ color: "lightcoral", fontFamily: "Nunito" });
			break;
		case "unknown":
			$(".cargo-installation").removeClass("inactive");
			$(".install-command").html("<span style='color: gray;'>$</span> cargo install cabin-language");
			$(".install-command").css({ color: "white", fontFamily: "'Consolas', 'Monospace'" });
			break;
	}
}

selectOs(getOs());