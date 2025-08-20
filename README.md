# Shopify Orders Report Generator

This is a simple web application to generate reports of Shopify orders based on a date range and tags. It can fetch orders from a single shop or multiple shops using an Excel file.

## Features

-   Fetch orders from a single Shopify store.
-   Fetch orders from multiple Shopify stores using an Excel file.
-   Filter orders by date range and tags.
-   Download the report as an Excel file.

## Prerequisites

-   [Node.js](https://nodejs.org/) (which includes npm)

## Setup

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <your-repository-name>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Build the application:**

    ```bash
    npm run build
    ```

## Usage

1.  **Start the proxy server:**

    This server is necessary to handle requests to the Shopify API and avoid CORS issues.

    ```bash
    node server.js
    ```

    The server will start on `http://localhost:3000`.

2.  **Open the application:**

    Open the `index.html` file in your web browser.

3.  **Fill in the details:**
    -   **Start Date & End Date:** Select the date range for the order report.
    -   **Tags:** Enter comma-separated tags to filter the orders.
    -   **Single Shop:**
        -   Enter the Shop URL (e.g., `https://your-store.myshopify.com`).
        -   Enter the Shopify Access Token.
        -   Click "Fetch Orders".
    -   **Multiple Shops:**
        -   Create an Excel file with two columns: `shopUrl` and `accessToken`.
        -   Upload the file.
        -   Click "Fetch Orders".

4.  **Download the report:**

    Once the orders are fetched, click the "Download Report" button to get the Excel file.

## How to get a Shopify Access Token

1.  Log in to your Shopify admin.
2.  Go to **Apps**.
3.  Click **Develop apps for your store**.
4.  Click **Create an app**.
5.  Give your app a name and click **Create app**.
6.  Go to the **API credentials** tab.
7.  Click **Configure Admin API scopes**.
8.  Select the `read_orders` scope.
9.  Click **Save**.
10. Click **Install app**.
11. Click **Reveal token once** to get your access token.
