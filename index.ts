import Redis from "ioredis";

import { Hono } from "hono";


export const Redist = new Redis({
    host: "localhost",
    port: 6379,
});


const TOKEN = process.env.TOKEN;


const app = new Hono();

app.use(async (c, n) => {
    if (process.env.NODE_ENV === "development") return n();
    const token = c.req.query("token");
    if (!token || token !== TOKEN) {
        return c.redirect("https://etre.pro");
    }
    return n();
});




app.get("get/:key", async c => {

    const data = await Redist.get(c.req.param("key"));


    return c.json({
        data
    });
});

app.get("hget/:key1/:key2", async c => {
    console.log(c.req.param("key1"), c.req.param("key2"))

    const data = await Redist.hget(c.req.param("key1"), c.req.param("key2"));


    return c.json({
        data
    });
});



export default {
    port: 4000,
    fetch: app.fetch,
} 