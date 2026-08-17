# 🚀 Deployment Architecture & High-Availability Topology
## NurseFlow Enterprise HIS 2026

**Target Environment:** Multi-Hospital Group (300+ Beds, 500+ Concurrent Clinical Sessions)  
**Infrastructure Model:** High-Availability Hybrid Cloud / On-Premise Kubernetes

---

## 1. 🏗️ High-Availability Multi-Tier Topology

```mermaid
graph TD
    Client[📱 Web / Mobile Clients<br>Doctors & Nurses] -->|HTTPS / WSS| CDN[☁️ Cloudflare CDN & WAF]
    CDN -->|SSL Termination| LB[⚖️ Nginx Ingress Controller]
    
    subgraph "Application Cluster (Kubernetes / Docker)"
        LB --> Web1[🖥️ Frontend Pod 1<br>Vite React 19]
        LB --> Web2[🖥️ Frontend Pod 2<br>Vite React 19]
        LB --> API1[⚙️ Node.js REST API 1]
        LB --> API2[⚙️ Node.js REST API 2]
        
        API1 --> EventBus[⚡ Redis Pub/Sub / SSE Engine]
        API2 --> EventBus
        
        Worker[🔄 Outbox Event Worker<br>SATUSEHAT & Audit]
    end
    
    subgraph "Data & Persistence Tier"
        API1 -->|Read / Write| PGMaster[(🐘 PostgreSQL 16 Primary)]
        API2 -->|Read / Write| PGMaster
        Worker -->|Read / Write| PGMaster
        
        PGMaster -->|Streaming Replication| PGReplica[(🐘 PostgreSQL 16 Read Replica)]
        
        API1 -->|Cache & Session| RedisCluster[(🔴 Redis Cluster 7.x)]
        API2 -->|Cache & Session| RedisCluster
        
        API1 --> ObjectStore[(🗄️ MinIO / Cloud Storage<br>DICOM & Medical Records)]
    end
```

---

## 2. 🛡️ Fault-Tolerance & Recovery Metrics
* **RPO (Recovery Point Objective):** $\le 0\text{ detik}$ (Synchronous streaming WAL replication pada database primer dan standby).
* **RTO (Recovery Time Objective):** $\le 30\text{ detik}$ (Automated healthcheck failover pada Ingress & database cluster).
* **Zero-Downtime Deployment:** Rolling updates pada Kubernetes pods menjamin pelayanan IGD dan rawat inap tetap berjalan 24/7 tanpa gangguan operasional.
