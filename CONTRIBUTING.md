# Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m 'Add feature'`
4. Push: `git push origin feature/my-feature`
5. Open PR

## Adding Skills

Skills come from the [skill7 database](https://github.com/Abderraouf-yt/skill7).

To add new skills:
1. Add SKILL.md to `data/skills/your-skill/`
2. Update `skills_index.json`
3. Copy updated index to `data/skills_index.json`

## Development

```bash
npm install
npm run dev    # Hot reload
npm run build  # Production build
```
