---
title: '[DRAFT] Fixture di prova della pipeline'
subtitle: 'Non è materiale didattico'
author: 'Fixture — pipeline self-test'
lang: it
---

# Unit 1.1 — Unità di prova

## Un gateway non raggiungibile blocca l'intera migrazione.

> Il cluster è pronto, l'immagine esiste, nessuno riesce a chiamare il servizio.

::: notes
**Tempo:** ~5 min

**Da dire:** Aprire con il fatto scomodo: finché nessuno raggiunge il gateway dall'esterno,
tutto il lavoro fatto sul cluster è invisibile al cliente. Non spiegare ancora
il perché tecnico, serve solo creare la domanda a cui l'unità risponde.

**Perché questa slide sta qui:** Apre il ciclo esperienziale con un problema concreto prima di qualsiasi teoria.

**Collegamenti:** Riprende il vocabolario condiviso, anticipa la deploy.

**Attenzione a:** La coppia ops tende a saltare subito alla soluzione: rimandare.

**Obiettivi:** G1
:::

## Il vostro compito è rendere il pod raggiungibile in quindici minuti.

1. Applicare il Deployment
2. Esporre il Service
3. Verificare la readiness probe
4. Chiamare l'endpoint dall'esterno

- [Documentazione Spring Cloud Gateway](https://docs.spring.io/spring-cloud-gateway/reference/)

::: notes
**Tempo:** ~6 min

**Da dire:** Assegnare le corsie ad alta voce prima di far partire il timer, altrimenti
i quattro partecipanti si sovrappongono sullo stesso passo. Tenere il tempo
visibile: il vincolo temporale è parte dell'esercizio, non un dettaglio.

**Perché questa slide sta qui:** Prima esperienza concreta; il fallimento parziale qui alimenta il debriefing.

**Collegamenti:** Prepara la formalizzazione del modello di deploy che arriva dopo.

**Attenzione a:** Chi finisce presto va messo a supportare l'altra corsia, non ad aggiungere extra.

**Obiettivi:** G1
:::

## Quasi sempre il blocco è il Service, non l'immagine.

- Cosa si è rotto per primo?
- Come lo avete capito?
- Cosa cambiereste ora?

::: notes
**Tempo:** ~5 min

**Da dire:** Far parlare prima chi ha incontrato l'errore, non chi ha trovato la soluzione.
Raccogliere le cause reali alla lavagna condivisa senza correggerle subito:
servono come materiale per la fase teorica successiva.

**Perché questa slide sta qui:** La riflessione è lo stadio che più spesso viene saltato ed è quello che
trasforma l'attività in apprendimento.

**Collegamenti:** Le cause raccolte qui vengono riprese una per una nella parte teorica.

**Attenzione a:** Rischio che diventi una sessione di soluzioni: riportare sulle cause.

**Obiettivi:** G1
:::

## Il traffico attraversa Service e probe prima di arrivare al pod.

![Percorso di una richiesta](tools/slides/example/out/build/fixture/mermaid/FIX-04.png)

::: notes
**Tempo:** ~5 min

**Da dire:** Percorrere il diagramma nell'ordine in cui la richiesta viaggia, fermandosi
sul ramo della probe: è lì che finivano gli errori raccolti nel debriefing.
Collegare ogni nodo a un errore realmente visto pochi minuti prima.

**Perché questa slide sta qui:** Fornisce il principio che spiega ciò che i partecipanti hanno già osservato.

**Collegamenti:** Chiude gli errori del debriefing, apre la modifica di configurazione seguente.

**Attenzione a:** Per la coppia sviluppo il ramo negativo della probe è il punto meno intuitivo.

**Obiettivi:** G1
:::

## Una probe corretta cambia il comportamento in modo osservabile.

```yaml
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 5
```

*Modifica da applicare e ridistribuire*

::: notes
**Tempo:** ~4 min

**Da dire:** Chiedere una previsione prima di applicare la modifica: cosa cambierà nella
risposta osservata? Poi ridistribuire e confrontare la previsione con il
risultato reale, che è il passaggio che consolida il principio appena visto.

**Perché questa slide sta qui:** Sperimentazione attiva sullo stesso ambiente, a complessità leggermente maggiore.

**Collegamenti:** Diventa l'esperienza concreta di apertura dell'unità successiva.

**Attenzione a:** Senza previsione dichiarata prima, il confronto perde valore formativo.

**Obiettivi:** G1
:::

## Placeholder di prova per un'immagine che deve fornire un umano.

> **DA FORNIRE:** Screenshot della console GKE con il workload in stato Running

::: notes
**Tempo:** ~3 min

**Da dire:** Mostrare la console reale del cliente chiude il cerchio: il partecipante
riconosce lo strumento che userà davvero al lavoro, non un esempio generico.

**Perché questa slide sta qui:** Verifica finale condivisa fra le due corsie prima della pausa.

**Collegamenti:** Riprende il compito iniziale e ne mostra il risultato raggiunto.

**Attenzione a:** Se lo screenshot manca, sostituire con una condivisione schermo dal vivo.

**Obiettivi:** G1
:::
