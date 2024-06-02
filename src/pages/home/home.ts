$(".installation-types").children().on("click", event => {
	$(".installation-types").children().addClass("inactive");
	$(event.target).removeClass("inactive");
});

type Os = "windows" | "linux" | "unknown" | "mac";

function getOs(): Os {
	if (navigator.userAgent.includes("win")) return "windows";
	if (navigator.userAgent.includes("linux")) return "linux";
	if (navigator.userAgent.includes("mac")) return "mac";
	return "unknown";
}

function selectOs(os: Os): void {
	$(".installation-types").children().addClass("inactive");
	switch (os) {
		case "windows":
			$(".windows-installation").removeClass(".inactive");
			break;
		case "linux":
			$(".linux-installation").removeClass(".inactive");
			break;
		case "unknown":
			$(".cargo-installation").removeClass(".inactive");
			break;
	}
}

selectOs(getOs());