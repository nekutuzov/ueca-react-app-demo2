import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser"

const apiBaseUrl = "http://localhost:8080/api"

const handlers = [
    // Add your mock API handlers here
    http.get(`${apiBaseUrl}/hello`, async () => {
        return HttpResponse.json({ message: "Hello from MSW!" });
    }),
];

export function initMocks() {
    // Initialize MSW worker by delaying the setup to avoid issues in the main thread during app startup
    setTimeout(async () => {
        const worker = setupWorker(...handlers);
        await worker.start({
            serviceWorker: {
                url: "/ueca-react-app-demo2/mockServiceWorker.js",
            },
            onUnhandledRequest: "bypass",
        })
    }, 10);
}

export { apiBaseUrl };
