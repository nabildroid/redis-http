import Redis from "ioredis";

import { Hono } from "hono";

import Bull from "bull";
import axios from "axios";

const RedisConfig = {
    host: "localhost",
    port: 6379,
}
export const Redist = new Redis(RedisConfig);

const schedulerQueue = new Bull("scheduler", {
    redis: RedisConfig
})

schedulerQueue.process(async (task) => {
    const { url, body } = task.data

    console.log("handling", url, body)

    await axios.post(url, body, {
        headers: {
            "User-Agent": "Etrepro-scheduler"
        }
    })
})

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




app.post("scheduler/:delay/:priority?", async c => {
    const priority = c.req.param("priority")
    const delay = parseInt(c.req.param("delay"))

    const data = await c.req.json();

    const { url, body } = data;



    const { id } = await schedulerQueue.add({ url, body }, {
        priority: !!priority ? parseInt(priority) : undefined,
        delay: delay,
    })

    return c.json({ taskId: id })
})


export default {
    port: 4000,
    fetch: app.fetch,
} 