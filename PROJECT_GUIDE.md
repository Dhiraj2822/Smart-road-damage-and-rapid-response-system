#`Smart`Road`Damage`Reporting`&`Rapid`Response`System

**For`Solapur`Municipal`Corporation`(SMC)**

##``Overview

A`strict,`audit-compliant`E-Governance`solution`for`reporting,`verifying,`and`resolving`road`damage.`Built`on`open-source`technologies`with`a`focus`on`data`sovereignty,`role-based`accountability,`and`human-in-the-loop`AI`governance.

##``Key`Compliance`Features

-`**Strict`State`Machine**:``SUBMITTED``->``VERIFIED``->``ASSIGNED``->``IN_PROGRESS``->``COMPLETED``->``CLOSED`
-`**Advisory`AI**:`AI`provides`support`(Damage`Type/Severity/Confidence)`but`**never**`auto-decides.
-`**Audit`Trail**:`Immutable`logs`for`every`action`(Verification,`Assignment,`Rejection).
-`**Data`Sovereignty**:`Self-hosted`Local`Storage`(No`Cloud/S3),`OpenStreetMap`(No`Paid`Google`APIs),`PostgreSQL.

##``Architecture

`
`````
``Citizen`App``````````Official`Dashboard
``(React`PWA)````````````(React`Admin)``
`````
````````````````````````````````
`````````
`````````````````````
`````````
````````````Backend`API`Server``
````````````(Node.js/Express)```
`````````
`````````````````````
`````````
```````````````````````````````
``````
````````PostgreSQL``````````Local`Storage
`````(Data`+`Audit)`````````(Evidence)
``````
`````````
````
``````AI`Service`
``````(Python/Local)```
````
`

##``Tech`Stack

###`Backend
-`**Runtime**:`Node.js`20+`with`Express.js
-`**Database**:`PostgreSQL`15`(Prisma`ORM)
-`**Auth**:`JWT`+`Role`Based`Access`Control`(RBAC)
-`**Storage**:`Local`File`System`(Self-Hosted)

###`AI/ML`(Advisory`Only)
-`**Framework**:`Python`3.10+`with`Flask
-`**Model**:`YOLOv8`(Local`Inference)
-`**Privacy**:`No`external`data`sharing

###`Frontend
-`**Framework**:`React`18`with`Vite
-`**Maps**:`Leaflet`+`OpenStreetMap`+`Nominatim
-`**Input**:`Camera-only`enforcement`(No`Gallery`Uploads)

###`DevOps
-`**Containers**:`Docker`+`Docker`Compose

##``Quick`Start

###`Prerequisites
-`Node.js`20+
-`Python`3.10+
-`Docker`&`Docker`Compose
-`PostgreSQL`Local`or`Container

###`1.`Start`Services

```bash
docker-compose`up`-d
```

###`2.`Backend`Setup

```bash
cd`backend
npm`install
copy`.env.example`.env
#`Edit`.env`with`your`credentials
npx`prisma`migrate`dev
npm`run`dev
```

###`3.`AI`Service

```bash
cd`ai-service
python`-m`venv`venv
venv\Scripts\activate
pip`install`-r`requirements.txt
python`model_server.py
```

###`4.`Citizen`App`&`Official`Dashboard

```bash
cd`citizen-app`&&`npm`install`&&`npm`run`dev
#`Citizen`Login:`citizen@test.com`/`password123
cd`official-dashboard`&&`npm`install`&&`npm`run`dev
#`Admin`Login:`admin@solapur.gov.in`/`admin123
```

##``Workflow`&`Statuses

1.`**SUBMITTED**:`Citizen`reports`damage`(Camera`+`GPS`Mandatory).
2.`**VERIFIED**:`Official`reviews`AI`suggestion,`confirms`damage`type/severity.
3.`**ASSIGNED**:`Official`assigns`contractor/department.`
4.`**IN_PROGRESS**:`Repair`work`started.
5.`**COMPLETED**:`Contractor`uploads`"After"`photo`(Camera`only).
6.`**CLOSED**:`Official`verifies`quality`and`closes`ticket.

##``License

Copyright``2026`Solapur`Municipal`Corporation.`All`rights`reserved.



##``AI`Role`&`Governance`Safeguards

The`AI`module`in`this`system`is`strictly`**Advisory`Decision`Support`System`(DSS)**.

1.``**No`Automated`Decisions**:`The`system`**never**`automatically`validates`a`complaint`or`assigns`a`contractor`based`on`AI`output.
2.``**Human-in-the-loop**:`Every`"VERIFIED"`status`change`requires`an`Official`to`explicitly`select`and`confirm`damage`type`and`severity.
3.``**Data`Isolation**:`AI`runs`locally`on`the`server.`No`image`data`is`sent`to`external`cloud`APIs.
4.``**Auditability**:`All`AI`suggestions`are`logged`in`the``AuditLog``table`separately`from`the`Official`s`final`decision.



###`5.`Contractor`App

`ash
cd`contractor-app`&&`npm`install`&&`npm`run`dev
#`Contractor`Login:`contractor@buildwell.com`/`password123
`

###`6.`Demo`Data`Seeding

To`populate`the`database`with`hackathon-ready`data:
`ash
cd`backend
npm`run`seed:demo
`
