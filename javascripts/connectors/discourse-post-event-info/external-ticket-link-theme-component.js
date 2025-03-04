import Component from "@glimmer/component";


export default class ExternalTicketLink extends Component {

    get ticketLink() {

        let url = this.args.outletArgs.event.url;
        let urlTag = document.querySelector('section.event__section.event-url > a');
        urlTag.classList.add("btn");
        urlTag.classList.add("btn-text");
        urlTag.classList.add("btn-small");
        urlTag.classList.add("btn-primary");
        urlTag.innerText = 'Buy Tickets';

        let base_domain = "https://insider.in";


        if (url.startsWith("https://district.in")) {
            base_domain = "https://district.in";
        }

        if (url.startsWith("https://www.district.in")) {
            base_domain = "https://www.district.in";
        }

        if (!url || !(url.startsWith("https://insider.in/") || url.startsWith("https://district.in/") || url.startsWith("https://www.district.in/")) || !url.endsWith("/event")) {
            // Not an valid insider.in event url;
            return;
        }

        this.fetchInsiderEventDataByUrl(url, base_domain).then((eventData => {


            let eventEndTime = new Date(eventData.max_show_end_utc_timestamp * 1000)

            if (eventEndTime <= new Date()) {
                urlTag.innerText = 'Tickets are unavailable';
                urlTag.classList.remove("btn-primary");
                return;
            }

            if (eventData.event_state === 'sold_out') {
                urlTag.innerText = 'Event is sold out';
                return;
            }

            urlTag.innerText = 'Buy Tickets ' + "(₹" + eventData.price_display_string + ")";
            urlTag.href = 'https://district.in/' + eventData.slug + '/event'

        }))
    }

    fetchInsiderEventDataByUrl = async function (url, base_domain) {


        const eventSlug = url.substring(url.indexOf(base_domain) + base_domain.length + 1, url.lastIndexOf("/event"))
        const response = await fetch("https://api.insider.in/event/getBySlug/" + eventSlug);
        const eventData = await response.json();
        if (eventData.result !== 'ok') {
            throw new Error("Error calling API");
        }
        return eventData.data;
    }

}
