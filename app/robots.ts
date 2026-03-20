export default function robots() {
    return {
      rules: {
        userAgent: "*",
        allow: "/",
      },
      sitemap: "https://resumeroast.in/sitemap.xml",
    };
  }
  ```
  
  **Step 5 — Push everything**
  ```
  git add .
  ```
  ```
  git commit -m "Add SEO metadata, sitemap, and robots.txt"
  ```
  ```
  git push