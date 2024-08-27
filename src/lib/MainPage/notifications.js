import {
  getMessaging,
} from "firebase/messaging";
import { app } from "../../back-end/firestoreConnection";
export const handleNotificationPermission = () => {
  console.log("Requesting permission...");
  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted. ");
    } else {
      console.error("permision rejected");
    }
  });
};

export const handleSW = () => {
    console.log("we are in handleSW");
    const messaging = getMessaging(app);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")

        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    } else {
      console.error("Service Worker not supported in this browser.");
    }
};
