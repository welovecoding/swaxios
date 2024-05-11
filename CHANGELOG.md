#### 0.2.5 (2024-05-11)

##### New Features

- Upgrade Commander ([#536](https://github.com/welovecoding/swaxios/pull/536)) ([578c26a0](https://github.com/welovecoding/swaxios/commit/578c26a0faa01868293618e4ae8cb460971bfcb6))
- Upgrade to Node v20 ([#535](https://github.com/welovecoding/swaxios/pull/535)) ([69a6b3e5](https://github.com/welovecoding/swaxios/commit/69a6b3e588c6922ba99121b7c4718d01d17ed8ae))
- Automatically merge dependency updates ([6896208a](https://github.com/welovecoding/swaxios/commit/6896208af721b9c106699561bf6a4f03b3f979dd))

#### 0.2.4 (2023-02-09)

#### 0.2.3 (2023-02-09)

#### 0.2.2 (2022-02-14)

#### 0.2.1 (2021-01-04)

##### New Features

- Reject OpenAPI 3 documents ([#273](https://github.com/welovecoding/swaxios/pull/273)) ([72ed2a4e](https://github.com/welovecoding/swaxios/commit/72ed2a4eb63e933f0ba5f4b68b9c835363480ae4))

##### Refactors

- Rename CI job ([3de0c692](https://github.com/welovecoding/swaxios/commit/3de0c6927895035795f5bf27aec3d8c33d819182))

### 0.2.0 (2021-01-03)

#### 0.1.4 (2019-12-27)

##### Bug Fixes

- Register Handlebars comparison helpers ([#164](https://github.com/welovecoding/swaxios/pull/164)) ([a0ccb858](https://github.com/welovecoding/swaxios/commit/a0ccb858f5b5ec5ec4e7b4605c27abff410c0b97))

#### 0.1.3 (2019-11-12)

##### Bug Fixes

- Normalize special characters in URL or keys ([#155](https://github.com/welovecoding/swaxios/pull/155)) ([16ec4ced](https://github.com/welovecoding/swaxios/commit/16ec4ced4af92ddacd3d9eabb55c88bfb6857733))

#### 0.1.2 (2019-09-04)

##### Bug Fixes

- Ignore TS test files ([#97](https://github.com/welovecoding/swaxios/pull/97)) ([d904ad50](https://github.com/welovecoding/swaxios/commit/d904ad50270da291e34fe7220ea2e930cc6e8346))

#### 0.1.1 (2019-08-14)

### 0.1.0 (2019-08-14)

##### New Features

- Interfaces generation ([#71](https://github.com/welovecoding/swaxios/pull/71)) ([59e56495](https://github.com/welovecoding/swaxios/commit/59e56495eaf4841ebd0f241543171d8dd041dac9))

#### 0.0.22 (2019-08-08)

##### Bug Fixes

- Add missing attributes and "boolean" type ([#72](https://github.com/welovecoding/swaxios/pull/72)) ([4c782608](https://github.com/welovecoding/swaxios/commit/4c78260822f25e28d5b4a92b9c85364892cc6251))
- Use original Swagger object and fix references ([#70](https://github.com/welovecoding/swaxios/pull/70)) ([68675443](https://github.com/welovecoding/swaxios/commit/68675443a724bfae842b8fdce9d3082bfe2912ff))
- Codeowners syntax ([#73](https://github.com/welovecoding/swaxios/pull/73)) ([41292d57](https://github.com/welovecoding/swaxios/commit/41292d57380c86936dd78ad39b7d20fd53bae7ab))

#### 0.0.21 (2019-08-07)

##### New Features

- Support Bearer authorization callback in operations ([#63](https://github.com/welovecoding/swaxios/pull/63)) ([44a830e2](https://github.com/welovecoding/swaxios/commit/44a830e27470c3b4f9350dac2b13530391e02bf9))

#### 0.0.20 (2019-08-07)

#### 0.0.19 (2019-08-06)

##### New Features

- Support operation ids in methods (#57) (2023a494)

#### 0.0.18 (2019-08-05)

##### New Features

- Use class properties (#53) (9f0adf20)

#### 0.0.17 (2019-07-31)

#### 0.0.16 (2019-07-25)

##### New Features

- Parse required attributes for body and query parameters (#48) (50c68933)

#### 0.0.15 (2019-07-18)

##### Chores

- Generate changelog when releasing (#39) (4e55b990)
- yarn upgrade --latest (3c3210ba)
- yarn upgrade --latest (ac995d0e)
- Downgrade "swagger-parser" (38074414)
- yarn upgrade --latest (5286ef8f)
- Switch push and publish for release (75d4b717)
- Use latest wire-web-ets Swagger file (#31) (3a50709d)
- Upgrade dependencies (293b93b9)
- yarn upgrade --latest (86f5316d)
- yarn upgrade --latest (fdab7c17)
- Move types to dev dependencies (7c08acbc)
- Push Git changes at the end [ci skip](0464ea5c)
- yarn upgrade --latest (54389a5c)
- Add Travis CI (#21) (2af65836)
- Add git pull to release script (c8d41432)
- Push tags when releasing (f4e1ed40)
- Add release script (5c103732)
- Use commander instead of caporal (#16) (1c1eb60a)
- Exclude tests from dist files (1265a47c)
- Change directory from "api" to "rest" (1670a0b5)
- Add dist script (c44017c6)
- Cleanup and streamline names (#7) (4b98c260)

##### Documentation Changes

- Fix image display (403dd2e8)
- Update logo subtitles (d0fa107c)
- Fix typo (dca3b7c9)
- Fix typo (f3bcb2a5)
- Update exemplary use (b0a3d619)
- Add TypeScript usage (446b6301)

##### New Features

- Read yaml files from URL (#34) (81ad29c7)
- Add descriptions, fix data sending (#29) (f31bbdff)
- Add force deletion flag (#27) (ffa408da)
- Parse schema from body parameters (#23) (ccdd5eb3)
- Import service names as unique names (#26) (b29a1bd6)
- Disable TSLint rules in output (cbbcc619)
- Add autogeneration disclaimer to output (#22) (8d026f1a)
- Support OpenAPI specs from URL (#19) (d7581c02)
- Log message on success (ab5fa9a8)
- Use caporal instead of minimist (#15) (84e3c04f)
- Add yaml support (#14) (0442c314)
- Copy templates when building and upgrade packages (#13) (249105bf)
- Give access to request defaults (4505f268)
- Index files (#8) (33c1896b)
- Add parameters (#6) (1d968231)
- Implement toString method (#5) (90040d30)
- Add CLI options (#4) (8967cdd7)
- Add response types (#2) (00e54cad)
- Generate base class (#1) (81bc3743)
- Render API client path (a0258428)
- Add Swagger 2.0 schema validator (8c053884)

##### Bug Fixes

- **release:** Make git commit work on Windows (43be8e6f)
- Support response body for DELETE requests (#38) (d3a90137)
- Unwrap body parameters (#36) (2e2b2cb5)
- Read all path parameters (#35) (d77a4163)
- Send post data without surrounding object (#32) (761d2f2e)
- Correct URL detection (#30) (2144fee3)
- Export from directories, too (#28) (d42bb2d9)
- Parse input URL (#25) (f20a3a60)
- Create firmer service names (#20) (e7658cc1)
- Correct template dir (#17) (b1b99105)
- Multiple variables in paths (#12) (da068883)
- Correctly generate objects in arrays (#11) (30f7eeee)
- Single API export, parameter (#10) (105196cf)
- Add CI, use template for imports, use private (#9) (89ef8d78)
- Set breakLength and fix output file (eb2ecda4)
- Remove redundant imports (#3) (f610ebe3)
- Correct line breaks on "inspect" for Windows (a4ac9d7f)
- Adjust import statements for Windows (9614b30d)

##### Other Changes

- Use infinite inspection depth (#33) (4259dc42)

##### Refactors

- Simplify StringUtil (c2fefd9b)
