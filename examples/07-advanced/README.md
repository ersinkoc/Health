# Advanced Examples

## custom-plugin.ts

Create custom plugins to extend functionality.

```bash
npx tsx examples/07-advanced/custom-plugin.ts
```

## clustering.ts

Run health checks across multiple processes.

```bash
npx tsx examples/07-advanced/clustering.ts
```

### Plugin System

Plugins extend the health kernel with additional functionality:

```typescript
interface Plugin {
  name: string;           // Unique identifier
  version: string;        // Semantic version
  dependencies?: string[]; // Plugin dependencies
  install: (kernel) => void;
  onInit?: (context) => void;
  onDestroy?: () => void;
  onError?: (error) => void;
}
```

### Event System

Plugins communicate through events:

```typescript
kernel.on('status:changed', (status) => {
  console.log('Status changed:', status);
});

kernel.emit('custom:event', { data: 'value' });
```

### Clustering

For high availability, run multiple instances:

- Use a process manager (PM2, forever)
- Load balance across instances
- Use a shared status store for coordinated shutdown
