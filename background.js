function getDomainPart(urlString) {
  // Get the root domain; the part between subdomain and suffix.
  // This doesn't work correctly for TLDs like .co.uk, but that doesn't matter for this implementation.
  if (!urlString) {
    return ""; // If no url, return empty string.
  }
  const url = new URL(urlString);

  // hostname = [subdomain(s), domain, suffix]
  const hostname = url.hostname.split(".");

  // Return the domain part.
  return hostname[hostname.length - 2];
}

function isCommentsPage(urlString) {
  const x = new URL(urlString);
  return x.pathname.split("/")[3] === "comments";
}

function isMessagePage(urlString) {
  const x = new URL(urlString);
  return x.pathname.split("/")[1] === "message";
}

function isWikiPage(urlString) {
  const x = new URL(urlString);
  return x.pathname.split("/")[3] === "wiki";
}

function checkOrigin(e) {
  let shouldCancel = false;

  // If this request is the first page-loading request:
  if (e.documentUrl === undefined) {
    const urlName = getDomainPart(e.url);
    const originSitename = getDomainPart(e.originUrl);
    console.log(
      "PREFERER: Checking '" +
        urlName +
        "' with referer '" +
        originSitename +
        "'"
    );

    // return immediately if the user is loading reddit straight from the omnibar.
    if (!originSitename) {
      console.log("PREFERER: '" + e.url + "' blocked by Preferer");
      return { cancel: true };
    }

    // Only allow the request if:
    if (
        // url is a reddit wiki page
        isWikiPage(e.url) ||
        // or you're on reddit navigating to or from messages
      (originSitename === urlName &&
        (isMessagePage(e.originUrl) || isMessagePage(e.url))) ||
        // or you're coming from a different site navigating to a comments page
      (originSitename !== urlName && isCommentsPage(e.url))
    ) {
      // Else block the request
      console.log("PREFERER: Allowed by Preferer, redirecting to " + e.url);
      shouldCancel = false;
    } else {
      console.log("PREFERER: '" + e.url + "' blocked by Preferer");
      shouldCancel = true;
    }
  }
  return { cancel: shouldCancel };
}

browser.webRequest.onBeforeSendHeaders.addListener(
  checkOrigin,
  {
    urls: ["*://*.reddit.com/*"],
  },
  ["blocking", "requestHeaders"]
);
