import * as XLSX from "xlsx";

interface ShopConfig {
  shopUrl: string;
  accessToken: string;
}

let reportData: { [shop: string]: any[] } = {};

document.getElementById("fetchSingle")?.addEventListener("click", async () => {
  const shopUrl = (
    document.getElementById("shopUrl") as HTMLInputElement
  ).value.trim();
  const accessToken = (
    document.getElementById("accessToken") as HTMLInputElement
  ).value.trim();

  if (!shopUrl || !accessToken) {
    updateStatus("Please enter Shop URL and Access Token");
    return;
  }

  await fetchOrdersForShop({ shopUrl, accessToken });
  enableDownload();
});

document
  .getElementById("fetchMultiple")
  ?.addEventListener("click", async () => {
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (!fileInput.files?.length) {
      updateStatus("Please upload an Excel file");
      return;
    }

    const file = fileInput.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    for (const row of rows) {
      const shopUrl = row["shopUrl"];
      const accessToken = row["accessToken"];
      if (shopUrl && accessToken) {
        await fetchOrdersForShop({ shopUrl, accessToken });
      }
    }
    enableDownload();
  });

document.getElementById("downloadReport")?.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  for (const shop in reportData) {
    const ws = XLSX.utils.json_to_sheet(reportData[shop]);
    const safeShopName = shop.replace(/[:\\/?*[\]]/g, "").substring(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, safeShopName);
  }
  XLSX.writeFile(wb, "ShopifyOrdersReport.xlsx");
});

async function fetchOrdersForShop({ shopUrl, accessToken }: ShopConfig) {
  updateStatus(`Fetching orders for ${shopUrl}...`);

  const startDate = (document.getElementById("startDate") as HTMLInputElement)
    .value;
  const endDate = (document.getElementById("endDate") as HTMLInputElement)
    .value;
  const tagsInput = (document.getElementById("tags") as HTMLInputElement).value;

  let queryFilter = "";
  if (startDate) {
    queryFilter += `created_at:>=${new Date(startDate).toISOString()}`;
  }
  if (endDate) {
    queryFilter += ` created_at:<=${new Date(endDate).toISOString()}`;
  }
  if (tagsInput.trim()) {
    queryFilter += ` tag:'${tagsInput
      .split(",")
      .map((t) => t.trim())
      .join("' OR tag:'")}'`;
  }

  const query = `
    query ($first: Int!, $query: String, $sortKey: OrderSortKeys) {
      orders(first: $first, query: $query, sortKey: $sortKey) {
        edges {
          node {
            id
            name
            createdAt
            customer {
              firstName
              lastName
            }
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 50) { 
              edges { 
                node { 
                  id 
                  title 
                  quantity 
                  sku 
                  variantTitle 
                  originalUnitPriceSet { 
                    shopMoney { 
                      amount 
                      currencyCode 
                    } 
                  } 
                  customAttributes {
                    key
                    value
                  }
                  discountedUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
            tags
          }
        }
      }
    }
  `;

  const variables = {
    first: 50,
    query: queryFilter,
    sortKey: "CREATED_AT",
  };

  const res = await fetch("http://localhost:3000/proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shop: shopUrl.replace("https://", ""),
      accessToken,
      query,
      variables,
    }),
  });

  if (!res.ok) {
    updateStatus(`Failed for ${shopUrl}: ${res.statusText}`);
    return;
  }

  const data = await res.json();

  if (data.errors) {
    updateStatus(`Failed for ${shopUrl}: ${data.errors[0].message}`);
    return;
  }

  const orders = data.data.orders.edges.map((edge: any) => {
    const order = edge.node;
    const orderData: any = {
      order_id: order.id,
      order_name: order.name,
      created_at: order.createdAt,
      customer: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : "",
      total_price: order.totalPriceSet.shopMoney.amount,
      currency: order.totalPriceSet.shopMoney.currencyCode,
      tags: order.tags.join(", "),
      line_items: JSON.stringify(
        order.lineItems.edges.map((item: any) => item.node)
      ),
    };

    console.log("Processing order:", order.tags);

    if (order.tags.includes("BreezeCart")) {
      const breezeCartItems = order.lineItems.edges
        .map((e: any) => e.node)
        .filter((item: any) =>
          item.customAttributes.some(
            (attr: any) => attr.key === "source" && attr.value === "breeze-cart"
          )
        );

      if (breezeCartItems.length > 0) {
        orderData.product_name = breezeCartItems
          .map((item: any) => item.title)
          .join("\n");
        orderData.quantity = breezeCartItems
          .map((item: any) => item.quantity)
          .join("\n");
        orderData.discounted_amount = breezeCartItems
          .map((item: any) => item.discountedUnitPriceSet.shopMoney.amount)
          .join("\n");
        orderData.original_amount = breezeCartItems
          .map((item: any) => item.originalUnitPriceSet.shopMoney.amount)
          .join("\n");
      }
    }
    return orderData;
  });

  reportData[shopUrl] = orders;
  updateStatus(`Fetched ${orders.length} orders for ${shopUrl}`);
}

function updateStatus(msg: string) {
  const status = document.getElementById("status");
  if (status) status.innerText = msg;
}

function enableDownload() {
  const btn = document.getElementById("downloadReport") as HTMLButtonElement;
  btn.disabled = false;
}
