const YAML = require('yaml');
const fs = require('fs');
const _ = require('lodash');
const Koa = require('koa');
const request = require('request-promise');

const app = new Koa();

const template = YAML.parse(fs.readFileSync('template.yml', { encoding: 'utf-8' }));

app.use(async (ctx) => {
    const { url } = ctx.request.query;
    if (!url) {
        ctx.status = 400;
        return;
    }
    const data = Buffer.from(await request(url), 'base64').toString();
    const result = data
        .trim()
        .split('\n')
        .map(raw => {
            const item = JSON.parse(
                Buffer.from(raw.replace('vmess://', ''), 'base64').toString()
            );
            return {
                name: item.ps,
                type: 'vmess',
                server: item.add,
                port: item.port,
                uuid: item.id,
                alterId: item.aid,
                cipher: 'auto',
                tls: item.tls === 'tls',
            };
        });

    const current = _.cloneDeep(template);
    current.Proxy = result;
    current['Proxy Group'].find(i => i.type === 'select').proxies = result.map(i => i.name);
    ctx.body = YAML.stringify(current);
});

app.listen(3000);
