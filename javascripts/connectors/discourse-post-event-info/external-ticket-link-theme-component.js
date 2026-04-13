import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";

export default class ExternalTicketLink extends Component {
  @tracked buttonText = "Loading…";
  @tracked buttonHref = "#";
  @tracked buttonTarget = "_blank";
  @tracked buttonClass = "btn-primary";
  @tracked isDisabled = false;
  @tracked showButton = false;

  constructor() {
    super(...arguments);
    this.processEventUrl();
  }

  get effectiveUrl() {
    const url = this.args.outletArgs?.event?.url;
    const location = this.args.outletArgs?.event?.location;
    return url || location || "";
  }

  isInsiderUrl(url) {
    return (
      (url.startsWith("https://insider.in/") ||
        url.startsWith("https://district.in/") ||
        url.startsWith("https://www.district.in/")) &&
      url.endsWith("/event")
    );
  }


  getBaseDomain(url) {
    if (url.startsWith("https://www.district.in")) {
      return "https://www.district.in";
    }
    if (url.startsWith("https://district.in")) {
      return "https://district.in";
    }
    return "https://insider.in";
  }
  async processEventUrl() {
    const url = this.effectiveUrl;

    if (!url) {

      this.showButton = false;
      return;
    }

    this.showButton = true;
    if (
      url.toLowerCase() === "coming soon" ||
      url.toLowerCase() === "tba"
    ) {
      this.buttonText = "Tickets will be available soon!";
      this.isDisabled = true;
      this.buttonHref = "#";
      this.buttonTarget = "_self";
      this.buttonClass = "btn-primary";
      return;
    }

    if (!this.isInsiderUrl(url)) {
      this.buttonText = "Register Here";
      this.buttonHref = url;
      this.buttonTarget = "_blank";
      this.buttonClass = "btn-primary";
      return;
    }

    this.buttonText = "Buy Tickets";
    this.buttonHref = url;
    this.buttonTarget = "_blank";

    try {
      const baseDomain = this.getBaseDomain(url);
      const eventData = await this.fetchInsiderEventData(url, baseDomain);

      // Check if the event has ended
      const eventEndTime = new Date(
        eventData.max_show_end_utc_timestamp * 1000
      );
      if (eventEndTime <= new Date()) {
        this.buttonText = "Event has ended";
        this.buttonClass = "";
        this.isDisabled = true;
        return;
      }

      // Check if the event is sold out
      let soldOut = true;
      eventData.venue?.shows?.forEach((show) => {
        show.items_for_sale?.forEach((ifs) => {
          ifs.items?.forEach((item) => {
            if (item.item_state !== "sold_out") {
              soldOut = false;
            }
          });
        });
      });

      if (eventData.event_state === "sold_out" || soldOut) {
        this.buttonText = "Event is sold out";
        this.buttonClass = "";
        this.isDisabled = true;
        return;
      }

      // Event is live
      this.buttonText = "Buy Tickets (₹" + eventData.price_string + ")";
      this.buttonHref =
        "https://district.in/" + eventData.slug + "/event";
    } catch {
      // On API failure keep the default "Buy Tickets" text
    }
  }

  async fetchInsiderEventData(url, baseDomain) {
    const eventSlug = url.substring(
      url.indexOf(baseDomain) + baseDomain.length + 1,
      url.lastIndexOf("/event")
    );
    const response = await fetch(
      "https://api-events.district.in/event/getBySlug/" + eventSlug
    );
    const eventData = await response.json();

    if (eventData.result !== "ok") {
      throw new Error("Error calling API");
    }

    return eventData.data;
  }
}
