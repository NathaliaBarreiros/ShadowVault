'use client';

import { useState, useEffect } from 'react';
import { VaultStorageService } from '@/lib/vault-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ZKIntegrityDebugPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [systemTestResult, setSystemTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = () => {
    const vaultEntries = VaultStorageService.getEntries();
    setEntries(vaultEntries);
    console.log('📄 Loaded vault entries:', vaultEntries);
  };

  const testSystem = async () => {
    setLoading(true);
    try {
      const result = await VaultStorageService.testIntegritySystem();
      setSystemTestResult(result);
      if (result) {
        toast.success('ZK Integrity system test passed!');
      } else {
        toast.error('ZK Integrity system test failed!');
      }
    } catch (error) {
      console.error('System test error:', error);
      toast.error('System test error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const testIntegrityVerification = async (entry: any) => {
    setLoading(true);
    setSelectedEntry(entry);
    
    try {
      // Mock Zircuit data based on the entry
      const zircuitData = {
        storedHash: entry.walrusMetadata?.storedHash || "176196dfd264fcd798d339993aeb8783dfe625e3e72d7cdeb379369f513683d",
        contractAddress: entry.walrusMetadata?.contractAddress || "0x577dc63554BF7531f75AF602896209fFe87d51E8",
        networkChainId: entry.walrusMetadata?.networkChainId || 48898
      };

      console.log('🧪 Testing integrity verification for entry:', entry);
      console.log('⛓️ Mock Zircuit data:', zircuitData);

      const result = await VaultStorageService.recoverPasswordWithIntegrityVerification(
        entry,
        zircuitData
      );

      setTestResult(result);
      
      if (result.integrityVerified) {
        toast.success('Password integrity verified successfully!');
      } else {
        toast.error('Password integrity verification failed: ' + result.error);
      }
    } catch (error) {
      console.error('Integrity test error:', error);
      toast.error('Integrity test error: ' + error);
      setTestResult({
        password: '',
        integrityVerified: false,
        error: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ZK Integrity Verification Debug</h1>
          <p className="text-muted-foreground">
            Test the Zero-Knowledge password integrity verification system
          </p>
        </div>
        <Button onClick={testSystem} disabled={loading}>
          {loading ? 'Testing...' : 'Test ZK System'}
        </Button>
      </div>

      {systemTestResult !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              System Test Result
              <Badge variant={systemTestResult ? "default" : "destructive"}>
                {systemTestResult ? "PASSED" : "FAILED"}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vault Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Vault Entries ({entries.length})</CardTitle>
            <CardDescription>
              Select an entry to test ZK integrity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedEntry?.id === entry.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{entry.name}</h3>
                    <p className="text-sm text-muted-foreground">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">Network: {entry.network}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      testIntegrityVerification(entry);
                    }}
                    disabled={loading}
                  >
                    Test Integrity
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              ZK integrity verification results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Generating ZK proof...</p>
                </div>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Status:</span>
                  <Badge variant={testResult.integrityVerified ? "default" : "destructive"}>
                    {testResult.integrityVerified ? "VERIFIED" : "FAILED"}
                  </Badge>
                </div>

                {testResult.integrityVerified && (
                  <>
                    <div>
                      <span className="font-semibold">Password:</span>
                      <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                        {testResult.password}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Proof Size:</span>
                      <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                        {testResult.proof?.length || 0} bytes
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold">Public Inputs:</span>
                      <div className="mt-1 p-2 bg-muted rounded font-mono text-sm max-h-32 overflow-auto">
                        {JSON.stringify(testResult.publicInputs, null, 2)}
                      </div>
                    </div>
                  </>
                )}

                {testResult.error && (
                  <div>
                    <span className="font-semibold text-destructive">Error:</span>
                    <div className="mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm">
                      {testResult.error}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground p-8">
                Select an entry and click "Test Integrity" to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Entry Details */}
      {selectedEntry && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {selectedEntry.name}
              </div>
              <div>
                <span className="font-semibold">Username:</span> {selectedEntry.username}
              </div>
              <div>
                <span className="font-semibold">Network:</span> {selectedEntry.network}
              </div>
              <div>
                <span className="font-semibold">Category:</span> {selectedEntry.category}
              </div>
              {selectedEntry.walrusMetadata && (
                <>
                  <div>
                    <span className="font-semibold">Stored Hash:</span>
                    <div className="font-mono text-xs break-all">
                      {selectedEntry.walrusMetadata.storedHash || 'Not available'}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Contract Address:</span>
                    <div className="font-mono text-xs break-all">
                      {selectedEntry.walrusMetadata.contractAddress || 'Not available'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
