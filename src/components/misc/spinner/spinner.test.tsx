import { describe, expect, it, vi } from "vitest";
import { act } from "@testing-library/react";
import { Spinner } from "@components";
import { mount, settle } from "@test";

// Advances fake time and lets the renders it causes land.
async function advance(ms: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

function spinnerOverlay(): HTMLElement {
    return document.getElementById("spinner");
}

function track(): SVGCircleElement {
    return spinnerOverlay().querySelector("circle");
}

function numericAttribute(element: Element, name: string): number {
    return parseFloat(element.getAttribute(name));
}

describe("Spinner", () => {
    it("renders nothing while not visible", async () => {
        const { container } = await mount(Spinner, { id: "spinner" });

        expect(container).toBeEmptyDOMElement();
    });

    it("covers its container with the scrim once made visible, and clears it when hidden", async () => {
        const { model } = await mount(Spinner, { id: "spinner" });

        model.visible = true;
        await settle();

        const overlay = spinnerOverlay();
        expect(overlay).toHaveClass("ueca-spinner");
        expect(overlay.style).toMatchObject({ position: "absolute", width: "100%", height: "100%", backgroundColor: "var(--scrim)" });
        // Above the toast layer: the busy overlay has to cover a dialog that started the work.
        expect(overlay.style.zIndex).toBe("calc(var(--z-toast) + 10)");

        model.visible = false;
        await settle();

        expect(spinnerOverlay()).toBeNull();
    });

    // The AppBusyDisplay path: a visible param that follows something and changes after mount.
    it("follows a visible param that changes between renders", async () => {
        const { update } = await mount(Spinner, { id: "spinner", visible: false });

        await update({ id: "spinner", visible: true });
        await settle();

        expect(spinnerOverlay()).toBeInTheDocument();
    });

    // Regression: _visible was only synchronised from onChangeVisible, which never fires for the value
    // a spinner is created with, so a spinner mounted visible stayed invisible until visible toggled.
    it("shows a spinner that is visible from the start", async () => {
        await mount(Spinner, { id: "spinner", visible: true });
        await settle(20);

        expect(spinnerOverlay()).toBeInTheDocument();
    });

    it("waits out its delayTime when it is visible from the start", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        await mount(Spinner, { id: "spinner", visible: true, delayTime: 500 });

        await advance(400);
        expect(spinnerOverlay()).toBeNull();

        await advance(200);
        expect(spinnerOverlay()).toBeInTheDocument();
    });

    it("stacks at its own zIndex when one is set", async () => {
        const { model } = await mount(Spinner, { id: "spinner", zIndex: 1500 });

        model.visible = true;
        await settle();

        expect(spinnerOverlay().style.zIndex).toBe("1500");
    });

    describe("delayTime", () => {
        it("appears only after the delay", async () => {
            const { model } = await mount(Spinner, { id: "spinner", delayTime: 1000 });
            vi.useFakeTimers({ shouldAdvanceTime: true });

            model.visible = true;
            await advance(500);
            expect(spinnerOverlay()).toBeNull();

            await advance(500);
            expect(spinnerOverlay()).toBeInTheDocument();
        });

        it("hides only after the delay too", async () => {
            const { model } = await mount(Spinner, { id: "spinner", delayTime: 1000 });
            vi.useFakeTimers({ shouldAdvanceTime: true });
            model.visible = true;
            await advance(1000);

            model.visible = false;
            await advance(500);
            expect(spinnerOverlay()).toBeInTheDocument();

            await advance(500);
            expect(spinnerOverlay()).toBeNull();
        });

        // The point of a delay: work that finishes quickly never flashes the overlay.
        it("never flashes for work that ends within the delay", async () => {
            const { model } = await mount(Spinner, { id: "spinner", delayTime: 1000 });
            vi.useFakeTimers({ shouldAdvanceTime: true });

            model.visible = true;
            await advance(300);
            model.visible = false;
            await advance(300);
            model.visible = true;
            await advance(100);
            model.visible = false;
            await advance(2000);

            expect(spinnerOverlay()).toBeNull();
            expect(model._visible).toBe(false);
        });

        it("settles on the last requested state when the delay ends", async () => {
            const { model } = await mount(Spinner, { id: "spinner", delayTime: 1000 });
            vi.useFakeTimers({ shouldAdvanceTime: true });

            model.visible = true;
            await advance(200);
            model.visible = false;
            await advance(200);
            model.visible = true;
            await advance(600);

            expect(spinnerOverlay()).toBeInTheDocument();
        });
    });

    describe("geometry", () => {
        it("draws an indeterminate ring by default: 40px, 3.6 thick, a full-length dash, in the primary colour", async () => {
            const { model } = await mount(Spinner, { id: "spinner" });
            model.visible = true;
            await settle();

            const svg = spinnerOverlay().querySelector("svg");
            expect(svg).toHaveAttribute("width", "40px");
            expect(svg).toHaveAttribute("height", "40px");
            expect(svg).toHaveAttribute("viewBox", "0 0 44 44");
            expect(svg).toHaveClass("ueca-spinner-svg", "indeterminate");

            const circle = track();
            expect(circle).toHaveClass("ueca-spinner-track", "indeterminate");
            expect(circle).toHaveAttribute("stroke", "var(--accent)");
            expect(numericAttribute(circle, "stroke-width")).toBe(3.6);
            // The stroke is centred on the radius, so the ring's outer edge stays on the 40-unit circle.
            expect(numericAttribute(circle, "r")).toBeCloseTo(18.2, 6);
            expect(numericAttribute(circle, "stroke-dasharray")).toBeCloseTo(114.354, 3);
            expect(circle).not.toHaveAttribute("stroke-dashoffset");
        });

        it("draws a determinate arc offset by the remaining share of the ring", async () => {
            const { model } = await mount(Spinner, { id: "spinner", variant: "determinate", thickness: 4, value: 25, size: "3rem", color: "error.main" });
            model.visible = true;
            await settle();

            expect(spinnerOverlay().querySelector("svg")).toHaveAttribute("width", "3rem");
            const circle = track();
            expect(circle).toHaveClass("ueca-spinner-track", "determinate");
            expect(circle).toHaveAttribute("stroke", "var(--error)");
            expect(numericAttribute(circle, "r")).toBe(18);
            // 75% of a 2π·18 ring still to go.
            expect(numericAttribute(circle, "stroke-dashoffset")).toBeCloseTo(84.823, 3);

            model.value = 100;
            await settle();

            expect(numericAttribute(track(), "stroke-dashoffset")).toBeCloseTo(0, 6);
        });

        // Regression: stroke-dashoffset only moves a dash PATTERN, and the determinate circle got no
        // stroke-dasharray (only the indeterminate one did), so a determinate spinner drew a full ring
        // whatever its value — the offset computed for it had nothing to shift.
        it("gives the determinate arc a dash pattern one ring long, so the offset shows the value", async () => {
            const { model } = await mount(Spinner, { id: "spinner", variant: "determinate", thickness: 4, value: 25 });
            model.visible = true;
            await settle();

            expect(numericAttribute(track(), "stroke-dasharray")).toBeCloseTo(113.097, 3);
        });
    });
});
